using System;
using System.Drawing;
using System.IO;
using System.Text;
using System.Text.RegularExpressions;
using System.Windows.Forms;

internal static class saveFileDialog
{
  [STAThread]
  private static int Main(string[] args)
  {
    try
    {
      if (args.Length != 1 || String.IsNullOrWhiteSpace(args[0]) || args[0] == "." || args[0] == ".."
        || Regex.IsMatch(args[0], @"[<>:""/\\|?*\u0000-\u001f\u007f-\u009f]"))
        throw new ArgumentException("保存文件名无效，不能包含路径或控制字符");

      Application.EnableVisualStyles();
      using (var owner = new Form())
      using (var dialog = new SaveFileDialog())
      {
        owner.ShowInTaskbar = false;
        owner.TopMost = true;
        owner.Opacity = 0;
        owner.StartPosition = FormStartPosition.CenterScreen;
        owner.Size = new Size(1, 1);
        owner.Show();
        owner.Activate();
        dialog.Title = "另存为";
        dialog.FileName = args[0];
        dialog.DefaultExt = Path.GetExtension(args[0]).TrimStart('.');
        dialog.OverwritePrompt = true;
        dialog.CheckPathExists = true;
        if (dialog.ShowDialog(owner) == DialogResult.OK)
        {
          using (var output = new StreamWriter(Console.OpenStandardOutput(), new UTF8Encoding(false)))
            output.Write(dialog.FileName);
        }
      }
      return 0;
    }
    catch (Exception error)
    {
      using (var output = new StreamWriter(Console.OpenStandardError(), new UTF8Encoding(false)))
        output.Write(error.Message);
      return 1;
    }
  }
}