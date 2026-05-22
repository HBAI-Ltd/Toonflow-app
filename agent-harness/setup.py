from setuptools import setup, find_namespace_packages

setup(
    name="cli-anything-toonflow-app",
    version="1.0.0",
    description=(
        "Standalone agent CLI for Toonflow-app — drives its real Express "
        "REST + Socket.IO backend (novel -> animated short-drama factory)."
    ),
    packages=find_namespace_packages(include=["cli_anything.*"]),
    install_requires=[
        "click>=8.0.0",
        "prompt-toolkit>=3.0.0",
    ],
    extras_require={
        # ScriptAgent chat uses Socket.IO; optional until you need it.
        "socket": ["python-socketio[client]>=5.0.0"],
        "test": ["pytest>=7.0.0", "python-socketio[client]>=5.0.0"],
    },
    entry_points={
        "console_scripts": [
            "cli-anything-toonflow-app="
            "cli_anything.toonflow_app.toonflow_app_cli:main",
        ],
    },
    package_data={
        "cli_anything.toonflow_app": ["skills/*.md"],
    },
    python_requires=">=3.10",
)
