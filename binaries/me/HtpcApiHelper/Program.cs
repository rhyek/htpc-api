using System;
using Microsoft.Win32;
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
    [Verb("gettvscaling", HelpText = "Get current TV scaling.")]
    class GetTvScalingOptions
    {
    }
    [DllImport("User32.Dll")]
    public static extern long SetCursorPos(int x, int y);
    static int RunMoveCursor(MoveCursorOptions opts)
    {
      SetCursorPos(opts.X, opts.Y);
      return 0;
    }
    static int RunGetScaling(GetTvScalingOptions opts)
    {
      var displayId = "tv" switch
      {
        "tv" => "GSMC0A016843009_01_07E3_8E^D7B7748EA403516B0B3778C3BF7727BE",
        "monitor" => "BNQ7F5EH4J00064019_10_07E2_78^A3B3E2720E9381AA9C947359FC12864C",
        "mini" => "GSM000116843009_01_07E3_ED^65ED78C5D0A4DEF5149034EFCF5AC3D4",
        _ => null
      };

      if (displayId == null)
      {
        Console.WriteLine("Unknown display.");
        return 1;
      }

      var selectedOption = Convert.ToInt32(Registry.GetValue($@"HKEY_CURRENT_USER\Control Panel\Desktop\PerMonitorSettings\{displayId}", "DpiValue", 0).ToString());
      var scaling = selectedOption switch
      {
        -7 => 100,
        -6 => 125,
        -5 => 150,
        -4 => 175,
        -3 => 200,
        -2 => 225,
        -1 => 250,
        0 => 300,
        1 => 350,
        _ => 100
      };

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
