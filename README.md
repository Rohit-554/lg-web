# Liquid Galaxy Web App

An immersive Google Earth web application for Liquid Galaxy, this project is the first web-components-based web app ever created for the Liquid Galaxy project. It offers innovative ways to control Google Earth and send KML data for immersive data visualization.

<img width="312" alt="Home" src="https://github.com/user-attachments/assets/2a7e8c53-6a22-4bea-813c-cd8c29aaf218" />
<img width="312" alt="Voice" src="https://github.com/user-attachments/assets/fa2b2341-1bb7-4d1b-afee-1c50f369688f" />
<img width="312" alt="Maps" src="https://github.com/user-attachments/assets/0e706c8a-c677-4896-bddf-8d5b039b2b9d" />
<img width="312" alt="Tools" src="https://github.com/user-attachments/assets/e9be3151-93e4-4c92-ab47-4b8e63bc966b" />
<img width="312" alt="Settings" src="https://github.com/user-attachments/assets/ff959042-4b8f-457a-908a-f49e1ed504c1" />
<img width="312" alt="QR code" src="https://github.com/user-attachments/assets/a75814c1-6703-4540-bbb8-b35faeec4926" />


---

## Features and Pages

### Home Page

<img src="./assets/Home.png" alt="Home Page Screenshot" width="200px" />

- Displays a hero section.
- Includes a "Send KML" button.
- Shows the connection status of your device with Google Earth, similar to the Settings page.

### Voice Page

<img src="./assets/Voice.png" alt="Voice Page Screenshot" width="200px" />

- Utilizes the Web Speech API for voice control.
- Execute commands like:
  - `Orbit the Earth`
  - `Send KML`
  - `Clean KML`

### Maps Page

<img src="./assets/Maps.png" alt="Maps Page Screenshot" width="200px" />

- Built using Leaflet.
- Control Google Earth with touch interactions on the map.
- **Innovation Highlight:**
  - Originated from the La Palma Volcano Tracker project.
  - Uses Google Maps for seamless interactivity.

### Tools Page

<img src="./assets/Tools.png" alt="Tools Page Screenshot" width="200px" />

- Provides utility tools for Liquid Galaxy management, such as:
  - Relaunch
  - Reboot
  - Shut Down
  - Clean KML
  - Clean Logo

### Settings Page

<img src="./assets/Settings.png" alt="Settings Page Screenshot" width="200px" />

- SSH and connect to Liquid Galaxy (Google Earth cluster).
- Connection Methods:
  - **QR Code Scan:**
    - QR code containing JSON structure:  

      ```json
      {
        "server": "https://192.168.29.126",
        "username": "lg",
        "ip": "192.168.29.124",
        "port": "2222",
        "password": "lg",
        "screens": "5"
      }
      ```

  - **Manual Input:**
    - Enter connection details (server, username, IP, port, password, screens).

---

## Why Use the Liquid Galaxy Web App?

This application is the seamless way to control Google Earth:

- Immersive data visualization with KML integration.
- Easy SSH-based cluster connectivity.
- Voice control for hands-free operation.
- Touch interaction with maps for intuitive navigation.
- Simplified tools for device management.

---

## Future Development

- Expand voice commands.
- Introduce more tools for advanced control.
- Enhance accessibility and usability features.

---

> [!TIP]
> As all the pages are in components, this project can be used as a template for future liquid galaxy projects.

---

## License

This project is licensed under the [MIT License](LICENSE).

---

Feel free to contribute or raise issues in the repository for continuous improvements.
