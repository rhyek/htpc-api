using System;
using CommandLine;
using System.Runtime.InteropServices;

namespace HtpcApiHelper
{
  class Program
  {
    [Verb("movecursor", HelpText = "Move cursor to x, y coordinates on the primary display.")]
    class MoveCursorOptions
    {
      [Value(0, MetaName = "x", HelpText = "X coordinate.", Required = true)]
      public int X { get; set; }
      [Value(1, MetaName = "y", HelpText = "Y coordinate.", Required = true)]
      public int Y { get; set; }
    }
    [Verb("getscaling", HelpText = "Get current scaling for specified display.")]
    class GetTvScalingOptions
    {
      [Value(0, MetaName = "display", HelpText = @"Display identifier. (eg. \\.\DISPLAY1)", Required = true)]
      public string Display { get; set; }
    }

    [DllImport("User32.Dll")]
    public static extern long SetCursorPos(int x, int y);
    [DllImport("gdi32.dll")]
    static extern int GetDeviceCaps(IntPtr hdc, int nIndex);
    public enum DeviceCap
    {
      VERTRES = 10,
      DESKTOPVERTRES = 117,
      // http://pinvoke.net/default.aspx/gdi32/GetDeviceCaps.html
    }
    [DllImport("gdi32.dll")]
    public static extern IntPtr CreateDC(string lpszDriver, string lpszDevice, string lpszOutput, IntPtr lpInitData);
    static int RunMoveCursor(MoveCursorOptions opts)
    {
      SetCursorPos(opts.X, opts.Y);
      return 0;
    }
    static int RunGetScaling(GetTvScalingOptions opts)
    {
      var display = CreateDC(opts.Display, "", "", IntPtr.Zero);
      int LogicalScreenHeight = GetDeviceCaps(display, (int)DeviceCap.VERTRES);
      int PhysicalScreenHeight = GetDeviceCaps(display, (int)DeviceCap.DESKTOPVERTRES);

      float scaling = (float)PhysicalScreenHeight / (float)LogicalScreenHeight;

      Console.WriteLine(scaling);
      return 0;
    }
    static int Main(string[] args)
    {
      return CommandLine.Parser.Default.ParseArguments<MoveCursorOptions, GetTvScalingOptions>(args)
        .MapResult(
          (MoveCursorOptions opts) => RunMoveCursor(opts),
          (GetTvScalingOptions opts) => RunGetScaling(opts),
          errors => 1
        );
    }
  }
}
