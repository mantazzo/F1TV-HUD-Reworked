# Data Recording and Playback

I am providing some tools to record the UDP data sent by the game, and play the recordings back to use the overlays. The usage implies that you have Node installed in your system. (Note: I may provide "easy-launch" solution in the future.)

## UDP Recorder

**Usage:** `node recorder.js [-- port XXXXX]`

Type the command above into your Terminal window to record the data sent by the game. The `[--port XXXXX]` part is Optional - only use it if your game is set to use a different port (other than 20777). Bear in mind that you will not be able to use the overlays while you're recording (feature is disabled for the time being). To stop the recording, just stop the execution of the process (press Ctrl+C in the Terminal window).

### Notes:
- All sessions will be saved to "recordings" folder.
- All sessions will maintain a UTC timestamp and UTC timezone (for example, 2026-05-29T13-18-19-616Z).
- Recording also saves time spent (for playback), so if you idle without live data too much, there will be gaps in the actual recording later.
- Keep in mind that these recordings will be **BIG** - as an example, a full 18 minutes qualifying session will take you around 1 GB in filesize.
    - The longer the recording session goes, and the more data the game sends, the bigger the recording will be.
- You can manually enable the "forwarding" of the data for live use, but you would need to modify the `recorder.js` file manually.

## Recording Player

**Usage:** `node player.js <recording> [--port XXXXX] [--speed 1.0] [--loop]`

Type the command above into your Terminal window to play any recording that you made. 
- `<recording>` is the filename for the recording (example: "session_2026-05-24T14-33-19-282Z.jsonl"). The field is mandatory.
- `[--port XXXXX]` is the port that will be used to send the recorded data to. This field is optional and will use port 20777 by default if not specified. 
- `[--speed 1.0]` is an optional field that allows you to control the initial speed of playback for the recording (can be useful for longer recordings). it is a multiplier (for example, 2.0 would be 2x speed). If not specified, it uses a standard 1.0 multiplier (1x speed).
- `[--loop]` is an optional flag that allows you to play the recording in a loop, when the recording automatically reaches the end.

The player might become very useful if you want to display recorded data in the overlays, so for example, you can record a session and focus on racing (and recording the race video), then you can record overlays separately and toggle them on the fly, to fit your recorded race better (using the recorded race data).

Note that you can also enter `node player.js` in your Terminal window to see the help, or to see what recordings are available.

While playing back a recording, some controls are also available in the Terminal window:

``` 
[Space] Pause/Resume the Recording Playback
[Plus]/[Minus] Speed up or Slow Down the Playback (in 0.25x steps)
[Arrow Left]/[Arrow Right] Rewind or Fast Forward the Recording by ~30 seconds
[PgUp]/[PgDn] (also known as [Page Up] and [Page Down]) Rewind or Fast Forward the Recording by ~5 minutes
[Q] Quit the Player
```

### Notes:
- The player plays back only recorded live UDP data, it does not provide "bookmarks" or something extra - it's just a simple player.
- You can only Rewind if you pause the playback - you cannot rewind until you pause the playback. You can fast forward without pausing, however.
    - It is recommended to refresh the overlays after rewinding, to avoid potential issues in the overlays. You will be reminded in the Terminal window to refresh your overlays as a precaution.
- The bigger the recording, the longer it will take to load it in. Keep that in mind when loading the sessions.
- The player will send pure recorded UDP data to the specified port. That might work with other apps as well, you may never know... 😉

---

I hope you find some use for these tools, and have fun.