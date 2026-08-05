# FunPay RPC

A desktop FunPay client with Discord Rich Presence, custom themes, and Windows notifications.

Русская версия: [README.md](README.md)

## Features

- Discord Rich Presence activity based on the FunPay Activities integration;
- bundled Stylus for managing user styles;
- CSS themes loaded from the `themes` folder;
- notification sounds loaded from the `sounds` folder;
- separate toggles for notification sounds and Windows notifications;
- Windows notifications containing the sender nickname and message text;
- application icon based on the official FunPay logo;
- the `funpay.EleanorMay-theme.css` theme is included in the release.

## Run from source

Node.js 20 or newer is required.

```text
npm install
npm run dev
```

Open the settings panel with `F1`.

## Themes and sounds

In development, use these folders:

```text
themes/
sounds/
```

After adding a file, press `Refresh` in the settings panel and select it from the list. `Open folder` opens the corresponding directory in Windows Explorer.

CSS files and `MP3`, `OGG`, `WAV`, `M4A`, `AAC`, and `FLAC` audio files are supported. CSS themes may include an `@-moz-document` block and can be uploaded to Userstyles.

## Build the Windows installer

```text
npm run build-win
```

The installer is created in the `build/` directory. On first launch, the bundled theme is copied to the user theme directory and can be selected in settings.

## License

This project is distributed under the MIT License. The bundled Stylus extension is distributed under GPLv3 according to its original terms.
