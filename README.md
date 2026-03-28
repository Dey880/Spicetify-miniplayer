# Pocket Player Miniplayer

A customized and reskinned version of the [Lyrics Miniplayer](https://github.com/FO-SS/Spictify-Lyric-Miniplayer) by [FO-SS](https://github.com/FO-SS), adapted to match the [StarryNight](https://github.com/spicetify/spicetify-themes/tree/master/StarryNight) theme with some extra features

## Overview

I built this miniplayer because I wasn’t satisfied with the default one and couldn’t find alternatives that fit my preferences. It was developed using the StarryNight *Forest* variant, so the design closely follows that aesthetic.

Most of the code is based on the original Lyrics Miniplayer, with some simplifications and additions:
- Removed features I didn’t find necessary
- Added a repeat toggle
- Added a CD-overlay effect
- Adjusted the HTML structure

Overall, the core functionality remains very similar to the original project.

## Credits

All credit goes to:
- [FO-SS](https://github.com/FO-SS) for the original Lyrics Miniplayer
- StarryNight theme contributors for the visual design

## Installation

1. Place `miniplayer.js` in:
   ```
   %appdata%\Roaming\spicetify\Extensions
   ```
2. Run the following commands:
   ```
   spicetify config extension miniplayer.js
   spicetify apply
   ```

After applying, a new button will appear in the top bar.

Enjoy 🎵