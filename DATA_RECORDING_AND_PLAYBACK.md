# Data Recording and Playback

I am providing some tools to record the UDP data sent by the game, and play the recordings back to use the overlays - or perhaps use the data in other places.

## UDP Recorder

**Simple Usage:** Use `record.bat` to record data (you need to have used `install.bat` to set up the server for this option to work properly). 

**Advanced Usage:** `node recorder.js [--port <port>] [--forward <port>]`

- Simple Usage case - run the `record.bat` launcher. 
    - You will be asked to enter port to capture data from (defaults to 20777), adding an extra Name tag to the file (for easier identification, for example; defaults to no extra name) and if you want to forward the data to another port while recording (so that you could use the overlays while recording, for example; defaults to 'No'). 
    - Any unanswered prompt will time out to default option (each question has a 10 second timeout if no typing is detected). 
    - Afterwards, just play the game and don't forget to stop recording when you're done (press Ctrl+C in the Recorder window). 
- Advanced Usage case - type the Advanced Usage command above into your Terminal window to record the data sent by the game. 
    - The `[--port <port>]` part is Optional - only use it if your game is set to use a different port (other than 20777). 
    - The `[--forward <port>]` part is also Optional - if set, it will allow the recorder forward the same data to another port, so that you can keep recording the data and use the same data in other places (for example, showing overlays while recording as well). 
    - To stop the recording, just stop the execution of the process (press Ctrl+C in the Terminal window).

### Notes:
- All sessions will be saved to "recordings" folder.
- All sessions will maintain a UTC timestamp and UTC timezone (for example, 2026-05-29T13-18-19-616Z).
- Recording also saves time spent (for playback), so if you idle without live data too much, there will be gaps in the actual recording later.
- Keep in mind that these recordings will be **BIG** - as an example, a full 18 minutes qualifying session will take you around 1 GB in filesize.
    - The longer the recording session goes, and the more data the game sends, the bigger the recording will be.
- If you want to have the questions mode from Simple Usage case in Advanced Usage case, run `node recorder.js --interactive`. 
- Recording and Forwarding ports cannot be the same (doesn't make sense logically, does it?).

## Recording Player

**Simple Usage:** Run `play.bat` to select a recording and play back the recorded data (you need to have used `install.bat` to set up the server for this option to work properly).

**Advanced Usage:** `node player.js [<recording>] [--port XXXXX] [--speed 1.0] [--loop]`

- Simple Usage case - run the `play.bat` launcher.
    - A picker will pop up, showing you a list of your recordings. Pick one from the list (enter the number).
        - You can also drag-and-drop the recording onto the `play.bat` launcher directly and it will work as well!
    - Afterwards, select the port where the data will be sent on (defaults to 20777), playback speed (defaults to 'normal speed', 1x) and if you want the recording to loop at the end (yes/no, defaults to 'n' (no)).
    - After the recording loads, you can control the playback using the buttons shown in the Player window.
- Advanced Usage case - type the command above into your Terminal window to play any recording that you made. 
    - `[<recording>]` is the filename for the recording (example: "session_2026-05-24T14-33-19-282Z.jsonl"). If empty, you will be asked to choose the recording from existing ones.
    - `[--port XXXXX]` is the port that will be used to send the recorded data to. This field is optional and will use port 20777 by default if not specified. 
    - `[--speed 1.0]` is an optional field that allows you to control the initial speed of playback for the recording (can be useful for longer recordings). it is a multiplier (for example, 2.0 would be 2x speed). If not specified, it uses a standard 1.0 multiplier (1x speed).
    - `[--loop]` is an optional flag that allows you to play the recording in a loop, when the recording automatically reaches the end.

The player might become very useful if you want to display recorded data in the overlays: as an example, you can record a session and focus on racing (and recording the race video), then you can record overlays separately and toggle them on the fly the way you want, to fit your recorded race better (using the recorded race data).

Note: entering `node player.js` in your Terminal window is technically equal to using the `play.bat` launcher.

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
    - This might be updated in the future with some sort of bookmark jumping, if I can figure out a way which would work the best.
- You can only Rewind if you pause the playback - you cannot rewind until you pause the playback. You can fast forward without pausing, however.
    - It is recommended to refresh the overlays after rewinding, to avoid potential issues in the overlays. You will be reminded in the Terminal window to refresh your overlays as a precaution.
- The bigger the recording, the longer it will take to load it in. Keep that in mind when loading the sessions.
- The player will send pure recorded UDP data to the specified port. That might work with other apps as well, you may never know... 😉

---

I hope you find some use for these tools, and have fun.