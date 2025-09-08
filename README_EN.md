**English**

# Splatoon 3 Weapon Roulette

A web tool for randomly selecting weapons in Splatoon 3. Perfect for private matches with friends, practicing with unfamiliar weapons, or any other scenario you can think of!

**[Try the Demo Here](https://yasaitachi.github.io/Splatoon3-WeaponRoulette/)**

---

## Features

### Core Features
- **Weapon Roulette**: Randomly assign weapons for 1 to 8 players at once.
- **Advanced Filtering**: Narrow down the weapon pool by class, sub weapon, and special weapon.
- **No Duplicates Mode**: An option to prevent the same weapon from being picked more than once in a session.
- **History**: Automatically saves and displays past roulette results, which persist even after closing the browser.
- **Probability Display**: Shows the real-time probability of each weapon being selected based on the current filter settings.
- **Multi-language Support**: Switch the UI and weapon names between English and Japanese.
- **Theme Customization**: Choose between light, dark, or a theme that follows your OS's system settings.
- **Fullscreen Mode**: An immersive fullscreen view for focused use.

### Online Features
- **Real-time Sync Rooms**:
  - Create password-protected rooms and invite friends with a link.
  - When you join a room, spin results, history, and filter settings are synced with all members in real-time.
  - Communicate with other participants using the in-room chat feature.
  - The host has control over spinning the roulette, changing filters, and more.
- **Player & Friend System**:
  - Set a player name and get a unique player ID (a 5-digit number starting with #).
  - Search for other players by their ID and send friend requests.
  - Check the online status of your friends.
- **Discord Webhook Integration**: Automatically send roulette results to a Discord channel.
- **Other**:
  - **Voice Input**: Use your microphone to input chat messages.
  - **Screen Sleep Prevention**: Prevents the device from going to sleep while the page is open.

### Admin Features
- **Admin Dashboard**:
  - View a summary of server activity (active rooms, online users, etc.).
  - Monitor and manage all rooms and users in real-time.
  - Forcefully dissolve rooms, view chat history, and check room members.
  - Perform administrative actions like changing user IDs, deleting accounts, and banning users from online features.
  - **Global Announcements**: Send announcements to all online users.

## How to Use

### For Offline Use
1.  **Enter Number of Players**: Set the number of players you want to draw for (1-8).
2.  **(Optional) Set Filters**:
    - Check only the weapon classes, sub weapons, and special weapons you want to include in the roulette.
    - Use the "Toggle All" button for quick selections.
3.  **(Optional) Enable No Duplicates**: Check the "No Duplicates" box if you don't want the same weapon to be chosen again.
4.  **Click "Spin"**: Press the button to start the roulette.
5.  **Check the Results**: The selected weapon(s) will be displayed on the screen. For multiple players, results are shown in a list.

### For Online Use
1.  **Set Up Your Player**:
    - Click the player icon in the top right to open "Player Settings" and enter your name for online play.
    - After confirming, your unique Player ID will be automatically generated.
2.  **Create or Join a Room**:
    - Click the signal icon in the top right to open "Online Settings".
    - **To Create**: Click the "Create New Room" button. A Room ID and password will be generated for you.
    - **To Join**: Enter the Room ID and password shared by the host, then click the "Join" button.
3.  **Inside the Room**:
    - **Host**: Changing the player count or clicking "Spin" will sync the roulette for all members. Filter changes are also synced.
    - **Members**: Wait for the host to perform actions. Everyone can use the chat feature.

## Tech Stack

- HTML, CSS, JavaScript (Vanilla JS, no libraries)
- Firebase (Realtime Database)Freeplan
