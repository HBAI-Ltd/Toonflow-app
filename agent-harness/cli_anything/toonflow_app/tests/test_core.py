"""Unit tests for cli-anything-toonflow-app (synthetic data, mocked I/O).

No real Toonflow-app server is started here. The ToonflowClient is replaced
with an in-memory fake so every core module is tested in isolation.
"""

from __future__ import annotations

import json
import os
import tempfile

import pytest

from cli_anything.toonflow_app.core import (
    agent as agent_mod,
    auth as auth_mod,
    db as db_mod,
    novel as novel_mod,
    production as prod_mod,
    project as project_mod,
    script as script_mod,
    task as task_mod,
    vendor as vendor_mod,
)
from cli_anything.toonflow_app.core import api as api_mod
from cli_anything.toonflow_app.core.session import (
    Session,
    _locked_save_json,
    get_session,
    reset_session,
)
from cli_anything.toonflow_app.utils.toonflow_app_backend import (
    ToonflowClient,
    ToonflowError,
)


# ── fakes ──────────────────────────────────────────────────────────────────


class FakeClient:
    """Records calls and returns canned responses by path."""

    def __init__(self, responses=None):
        self.token = "Bearer faketoken"
        self.calls = []
        self.responses = responses or {}

    def post(self, path, body=None, timeout=120):
        self.calls.append(("POST", path, body))
        return self.responses.get(path, {"ok": True, "path": path})

    def get(self, path, raw_response=False, timeout=120):
        self.calls.append(("GET", path, None))
        if raw_response:
            return json.dumps(
                {"exportTime": 1, "tables": {"o_project": [], "o_user": []}}
            ).encode("utf-8")
        return self.responses.get(path, {"ok": True})

    def login(self, u, p):
        self.calls.append(("LOGIN", u, p))
        self.token = "Bearer faketoken"
        return {"token": "Bearer faketoken", "name": u, "id": 1}


@pytest.fixture
def sess():
    reset_session()
    s = get_session()
    s.new(base_url="http://localhost:10588")
    s.set("token", "Bearer faketoken")
    return s


_CLIENT_MODULES = (
    api_mod,
    auth_mod,
    project_mod,
    novel_mod,
    script_mod,
    prod_mod,
    vendor_mod,
    agent_mod,
    task_mod,
    db_mod,
)


def _patch_all(monkeypatch, fc):
    """Patch ``client_from_session`` in every module that imported it.

    Each domain module does ``from ...api import client_from_session``, binding
    the name into its own namespace, so we must patch each namespace.
    """
    stub = lambda s, require_auth=True: fc  # noqa: E731
    for mod in _CLIENT_MODULES:
        if hasattr(mod, "client_from_session"):
            monkeypatch.setattr(mod, "client_from_session", stub)


@pytest.fixture
def fake(monkeypatch):
    fc = FakeClient()
    _patch_all(monkeypatch, fc)
    return fc


# ── session ────────────────────────────────────────────────────────────────


class TestSession:
    def test_new_sets_defaults_and_modified(self):
        s = Session()
        st = s.new()
        assert st["base_url"] == "http://localhost:10588"
        assert s._modified is True

    def test_save_load_round_trip(self):
        with tempfile.TemporaryDirectory() as d:
            p = os.path.join(d, "s.json")
            s = Session()
            s.new()
            s.set("project_id", 42)
            s.save(p)
            s2 = Session()
            s2.load(p)
            assert s2.get("project_id") == 42
            assert s2._modified is False

    def test_undo_redo(self):
        s = Session()
        s.new()
        s.set("project_id", 1)
        s.set("project_id", 2)
        assert s.get("project_id") == 2
        assert s.undo() is True
        assert s.get("project_id") == 1
        assert s.redo() is True
        assert s.get("project_id") == 2

    def test_undo_empty_returns_false(self):
        s = Session()
        s.new()
        # clear undo history accumulated by new()
        s._undo.clear()
        assert s.undo() is False

    def test_locked_save_json_writes_valid_json(self):
        with tempfile.TemporaryDirectory() as d:
            p = os.path.join(d, "x.json")
            _locked_save_json(p, {"a": 1, "b": "二"})
            assert json.loads(open(p, encoding="utf-8").read()) == {
                "a": 1,
                "b": "二",
            }

    def test_load_missing_raises(self):
        with pytest.raises(FileNotFoundError):
            Session().load("/no/such/file.json")

    def test_singleton(self):
        reset_session()
        assert get_session() is get_session()


# ── ToonflowClient ─────────────────────────────────────────────────────────


class TestClientParsing:
    def test_parse_unwraps_data(self):
        out = ToonflowClient._parse(
            json.dumps({"code": 200, "data": {"x": 1}, "message": "ok"}).encode(),
            200,
        )
        assert out == {"x": 1}

    def test_parse_raises_on_error_code(self):
        with pytest.raises(ToonflowError):
            ToonflowClient._parse(
                json.dumps({"code": 400, "data": None, "message": "bad"}).encode(),
                200,
            )

    def test_parse_non_json(self):
        out = ToonflowClient._parse(b"not json", 200)
        assert out["raw"] == "not json"

    def test_extract_message(self):
        msg = ToonflowClient._extract_message(
            json.dumps({"message": "boom"}).encode()
        )
        assert msg == "boom"

    def test_unreachable_raises_actionable(self):
        c = ToonflowClient(base_url="http://127.0.0.1:1")
        with pytest.raises(ToonflowError) as e:
            c.post("/api/project/getProject", {})
        assert "server start" in str(e.value)

    def test_login_stores_token(self, monkeypatch):
        c = ToonflowClient(base_url="http://x")
        monkeypatch.setattr(
            c, "post", lambda *a, **k: {"token": "Bearer T", "name": "admin", "id": 1}
        )
        data = c.login("admin", "admin123")
        assert c.token == "Bearer T"
        assert data["name"] == "admin"


# ── api helpers ────────────────────────────────────────────────────────────


class TestApiHelpers:
    def test_require_project_raises_when_unset(self):
        s = Session()
        s.new()
        with pytest.raises(ToonflowError):
            api_mod.require_project(s)

    def test_require_project_override(self):
        s = Session()
        s.new()
        assert api_mod.require_project(s, 7) == 7

    def test_require_script_raises(self):
        s = Session()
        s.new()
        with pytest.raises(ToonflowError):
            api_mod.require_script(s)

    def test_client_requires_auth(self):
        s = Session()
        s.new()
        with pytest.raises(ToonflowError):
            api_mod.client_from_session(s, require_auth=True)


# ── auth ───────────────────────────────────────────────────────────────────


class TestAuth:
    def test_login_stores_token(self, sess, monkeypatch):
        fc = FakeClient()
        _patch_all(monkeypatch, fc)
        out = auth_mod.login(sess, "admin", "admin123")
        assert out["username"] == "admin"
        assert sess.get("token") == "Bearer faketoken"

    def test_whoami(self, sess):
        info = auth_mod.whoami(sess)
        assert info["authenticated"] is True
        assert info["base_url"] == "http://localhost:10588"


# ── project ────────────────────────────────────────────────────────────────


class TestProject:
    def test_create_merges_defaults(self, sess, fake):
        project_mod.create(sess, "Demo", intro="hi")
        method, path, body = fake.calls[-1]
        assert path == "/api/project/addProject"
        assert body["name"] == "Demo"
        assert body["intro"] == "hi"
        assert body["projectType"] == "shortDrama"  # default

    def test_list_normalizes(self, sess, monkeypatch):
        fc = FakeClient({"/api/project/getProject": [{"id": 1, "name": "A"}]})
        _patch_all(monkeypatch, fc)
        assert project_mod.list_projects(sess) == [{"id": 1, "name": "A"}]

    def test_edit_fills_missing_from_current(self, sess, monkeypatch):
        fc = FakeClient(
            {"/api/project/getProject": [{"id": 5, "name": "Old", "intro": "i"}]}
        )
        _patch_all(monkeypatch, fc)
        project_mod.edit(sess, 5, name="New")
        body = fc.calls[-1][2]
        assert body["id"] == 5
        assert body["name"] == "New"
        assert body["intro"] == "i"  # preserved from current

    def test_delete_clears_current(self, sess, fake):
        sess.update(project_id=9)
        project_mod.delete(sess, 9)
        assert sess.get("project_id") is None

    def test_use_sets_id(self, sess):
        project_mod.use(sess, 11)
        assert sess.get("project_id") == 11


# ── novel ──────────────────────────────────────────────────────────────────


class TestNovel:
    def test_import_normalizes(self, sess, fake):
        sess.update(project_id=3)
        novel_mod.import_chapters(
            sess, [{"chapter": "C1", "chapterData": "text"}]
        )
        body = fake.calls[-1][2]
        assert body["projectId"] == 3
        assert body["data"][0]["index"] == 1
        assert body["data"][0]["chapterData"] == "text"

    def test_extract_events_body(self, sess, fake):
        sess.update(project_id=3)
        novel_mod.extract_events(sess, [1, 2], concurrent_count=4)
        body = fake.calls[-1][2]
        assert body["novelIds"] == [1, 2]
        assert body["concurrentCount"] == 4


# ── script ─────────────────────────────────────────────────────────────────


class TestScript:
    def test_add_body(self, sess, fake):
        sess.update(project_id=2)
        script_mod.add(sess, "S1", "content", [7])
        body = fake.calls[-1][2]
        assert body == {
            "name": "S1",
            "content": "content",
            "projectId": 2,
            "assets": [7],
        }

    def test_set_plan_body(self, sess, fake):
        sess.update(project_id=2)
        script_mod.set_plan(sess, "skeleton", "strategy")
        body = fake.calls[-1][2]
        assert body["data"]["storySkeleton"] == "skeleton"
        assert body["agentType"] == "scriptAgent"


# ── production (cost gating) ───────────────────────────────────────────────


class TestProductionGating:
    def test_generate_image_refuses_without_confirm(self, sess, fake):
        sess.update(project_id=1, script_id=1)
        with pytest.raises(ToonflowError) as e:
            prod_mod.generate_image(sess, [1], confirmed=False)
        assert "--confirm" in str(e.value)
        assert fake.calls == []  # NO paid API call made

    def test_generate_video_refuses_without_confirm(self, sess, fake):
        sess.update(project_id=1, script_id=1)
        with pytest.raises(ToonflowError):
            prod_mod.generate_video(
                sess, [{"id": 1, "sources": "assets"}], "p", "m", "mode",
                "1080p", 5, 1, confirmed=False,
            )
        assert fake.calls == []

    def test_generate_image_calls_api_when_confirmed(self, sess, fake):
        sess.update(project_id=1, script_id=1)
        prod_mod.generate_image(sess, [1, 2], confirmed=True)
        assert fake.calls[-1][1] == (
            "/api/production/storyboard/batchGenerateImage"
        )

    def test_storyboard_is_read_only(self, sess, fake):
        sess.update(project_id=1)
        prod_mod.storyboard(sess)
        assert fake.calls[-1][1] == (
            "/api/production/storyboard/getStoryboardData"
        )


# ── vendor / agent / task ──────────────────────────────────────────────────


class TestVendorAgentTask:
    def test_vendor_add_sends_ts_code(self, sess, fake):
        vendor_mod.add(sess, "export const vendor = {}")
        body = fake.calls[-1][2]
        assert body["tsCode"].startswith("export const vendor")

    def test_vendor_set_inputs(self, sess, fake):
        vendor_mod.set_inputs(sess, "openai", {"apiKey": "sk-x"})
        body = fake.calls[-1][2]
        assert body == {"id": "openai", "inputValues": {"apiKey": "sk-x"}}

    def test_agent_deploy_body(self, sess, fake):
        agent_mod.deploy(sess, 1, "n", "gpt", "gpt-4o", "d", vendor_id="openai")
        body = fake.calls[-1][2]
        assert body["modelName"] == "gpt-4o"
        assert body["vendorId"] == "openai"

    def test_task_list_includes_project(self, sess, fake):
        sess.update(project_id=8)
        task_mod.list_tasks(sess, page=2, limit=5)
        body = fake.calls[-1][2]
        assert body["page"] == 2 and body["projectId"] == 8


# ── db (cost / destructive gating) ─────────────────────────────────────────


class TestDb:
    def test_export_writes_file_and_lists_tables(self, sess, fake):
        with tempfile.TemporaryDirectory() as d:
            out = os.path.join(d, "bk.json")
            res = db_mod.export_db(sess, out)
            assert os.path.isfile(out)
            assert "o_project" in res["tables"]

    def test_import_refuses_without_confirm(self, sess, fake):
        with tempfile.TemporaryDirectory() as d:
            p = os.path.join(d, "bk.json")
            open(p, "w").write(json.dumps({"tables": {"o_project": []}}))
            with pytest.raises(ToonflowError) as e:
                db_mod.import_db(sess, p, confirmed=False)
            assert "--confirm" in str(e.value)
            assert fake.calls == []

    def test_import_calls_api_when_confirmed(self, sess, fake):
        with tempfile.TemporaryDirectory() as d:
            p = os.path.join(d, "bk.json")
            open(p, "w").write(json.dumps({"tables": {"o_project": []}}))
            db_mod.import_db(sess, p, confirmed=True)
            assert fake.calls[-1][1] == "/api/setting/dbConfig/importData"
