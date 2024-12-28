OptiNet - Network Diagnostic & Monitoring Tools
=============================================

A Python-based network monitoring tool that provides real-time bandwidth monitoring and network interface information.

Requirements
-----------
- Python 3.x (Download from https://www.python.org/downloads/)
- Internet connection for initial setup

Required Python Packages
----------------------
Run these commands in your terminal/command prompt to install required packages:
```
pip install flask
pip install flask-socketio
pip install psutil
```

Directory Structure
-----------------
Make sure all files are in their correct folders:
```
OptiNet/
├── app.py
├── static/
│   ├── script.js
│   └── styles.css
└── templates/
    └── index.html
```

How to Run
---------
1. Open terminal/command prompt
2. Navigate to the OptiNet folder:
   ```
   cd path_to_OptiNet_folder
   ```
3. Run the application:
   ```
   python app.py
   ```
4. Open your web browser and go to:
   ```
   http://localhost:5000
   ```

Troubleshooting
--------------
1. If port 5000 is already in use:
   - Open app.py
   - Change the port number in the last line:
     ```python
     socketio.run(app, debug=True, host='0.0.0.0', port=5000)
     ```
   - Try another port like 8080 or 3000
   - Update your browser URL accordingly (e.g., localhost:8080)

2. If Python is not recognized:
   - Make sure Python is installed
   - Add Python to your system PATH
   - Try using 'python3' instead of 'python'

3. If pip install fails:
   - Try running as administrator/sudo
   - Update pip: python -m pip install --upgrade pip

Features
--------
- Real-time bandwidth monitoring (upload/download speeds)
- Network interface information
- Active connection status
- Data transfer statistics

Note: This application requires administrator/sudo privileges to access network information.

Created by: Arif Arman Bin Mazlan
Course: CST338