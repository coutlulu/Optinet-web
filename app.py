from flask import Flask, render_template, jsonify
from flask_socketio import SocketIO
import psutil
import time
import json
import subprocess
import platform
import socket
import dns.resolver
import socket
from datetime import datetime
from flask import request
import requests
from scapy.all import ARP, Ether, srp, sniff, IP
import ipaddress

app = Flask(__name__)
app.config['SECRET_KEY'] = 'secret!'
app.config['STATIC_FOLDER'] = 'static'
app.config['STATIC_URL_PATH'] = '/static'
socketio = SocketIO(app, cors_allowed_origins="*")

# Routes for split pages
@app.route('/')
def index():
    return render_template('index.html')

@app.route('/analyzer')
def analyzer():
    return render_template('analyzer.html')

@app.route('/about')
def about():
    return render_template('about.html')

def scan_network(ip_range): #
    try:
        arp_request = ARP(pdst=str(ip_range))
        broadcast = Ether(dst="ff:ff:ff:ff:ff:ff")
        arp_request_broadcast = broadcast / arp_request
        answered_list = srp(arp_request_broadcast, timeout=2, verbose=False)[0]
        
        devices = []
        for sent, received in answered_list:
            devices.append({
                'ip': received.psrc,
                'mac': received.hwsrc
            })
        return {"success": True, "devices": devices}
    except Exception as e:
        return {"success": False, "error": str(e)}

@app.route('/api/scan-network', methods=['POST'])
def scan_network_route():
    data = request.get_json()
    ip_range = data.get('ip_range')
    
    try:
        ipaddress.ip_network(ip_range, strict=False)
        result = scan_network(ip_range)
        return jsonify(result)
    except ValueError:
        return jsonify({"success": False, "error": "Invalid IP range"}) #

@app.route('/network-scan')
def network_scan():
    return render_template('network-scan.html')    

# Bandwidth monitoring function
def get_bandwidth_data():
    last_received = psutil.net_io_counters().bytes_recv
    last_sent = psutil.net_io_counters().bytes_sent
    last_total = last_received + last_sent

    time.sleep(0.5)

    bytes_received = psutil.net_io_counters().bytes_recv
    bytes_sent = psutil.net_io_counters().bytes_sent
    bytes_total = bytes_received + bytes_sent
    
    new_received = bytes_received - last_received
    new_sent = bytes_sent - last_sent
    new_total = bytes_total - last_total
    
    mbps_new_received = (new_received * 8 * 2) / 1024 / 1024
    mbps_new_sent = (new_sent * 8 * 2) / 1024 / 1024
    mbps_new_total = (new_total * 8 * 2) / 1024 / 1024

    return {
        'download': round(mbps_new_received, 2),
        'upload': round(mbps_new_sent, 2),
        'total': round(mbps_new_total, 2)
    }

# Network interface information
def get_interface_info():
    interfaces = []
    
    if_addrs = psutil.net_if_addrs()
    if_stats = psutil.net_if_stats()
    io_counters = psutil.net_io_counters(pernic=True)
    
    for interface_name in if_addrs.keys():
        interface_info = {
            'name': interface_name,
            'addresses': [],
            'status': 'Down',
            'speed': '0 Mbps',
            'bytes_sent': 0,
            'bytes_recv': 0
        }
        
        for addr in if_addrs[interface_name]:
            if addr.family == 2:  # IPv4
                address_info = {
                    'address': addr.address,
                    'type': 'IPv4'
                }
                interface_info['addresses'].append(address_info)
            elif addr.family == 23:  # IPv6
                address_info = {
                    'address': addr.address,
                    'type': 'IPv6'
                }
                interface_info['addresses'].append(address_info)
        
        if interface_name in if_stats:
            stats = if_stats[interface_name]
            interface_info['status'] = 'Up' if stats.isup else 'Down'
            interface_info['speed'] = f"{stats.speed} Mbps" if stats.speed > 0 else 'Unknown'
        
        if interface_name in io_counters:
            counters = io_counters[interface_name]
            interface_info['bytes_sent'] = counters.bytes_sent
            interface_info['bytes_recv'] = counters.bytes_recv
        
        interfaces.append(interface_info)
    
    return interfaces

# Network analysis tools
def ping_host(host, count=4):
    try:
        param = '-n' if platform.system().lower() == 'windows' else '-c'
        command = ['ping', param, str(count), host]
        result = subprocess.run(command, capture_output=True, text=True, timeout=10)
        return result.stdout
    except subprocess.TimeoutExpired:
        return "Ping timed out after 10 seconds"
    except Exception as e:
        return f"Ping failed: {str(e)}"

def nslookup(domain):
    try:
        resolver = dns.resolver.Resolver()
        results = []
        
        for record_type in ['A', 'AAAA', 'MX', 'NS', 'TXT']:
            try:
                answers = resolver.resolve(domain, record_type)
                for rdata in answers:
                    if record_type == 'MX':
                        results.append((record_type, f"{rdata.preference} {rdata.exchange}"))
                    else:
                        results.append((record_type, str(rdata)))
            except dns.resolver.NoAnswer:
                continue
            except Exception:
                continue

        return results if results else [("Info", "No records found")]
    except Exception as e:
        return f"NSLookup failed: {str(e)}"

def traceroute(host, max_hops=30):
    try:
        param = 'tracert' if platform.system().lower() == 'windows' else 'traceroute'
        command = [param, host]
        result = subprocess.run(command, capture_output=True, text=True, timeout=30)
        return result.stdout
    except subprocess.TimeoutExpired:
        return "Traceroute timed out after 30 seconds"
    except Exception as e:
        return f"Traceroute failed: {str(e)}"

def load_ports(file_name='ports.txt'):
    port_dict = {}
    try:
        with open(file_name, 'r') as file:
            for line in file:
                parts = line.strip().split(' ')
                if len(parts) == 2:
                    port, service = parts
                    port_dict[port] = service
    except FileNotFoundError:
        print(f"Warning: {file_name} not found. No service names will be loaded.")
    return port_dict

def scan_port(target_ip, port):
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as sock:
        sock.settimeout(1)
        result = sock.connect_ex((target_ip, port))
        return (port, result == 0)

def port_scanner(target, start_port, end_port):
    port_services = load_ports()
    
    try:
        target_ip = socket.gethostbyname(target)
    except socket.gaierror:
        return {"error": "Hostname could not be resolved."}
    
    open_ports = []
    closed_ports = []
    port_details = []
    
    start_time = datetime.now()
    
    try:
        for port in range(start_port, end_port + 1):
            result = scan_port(target_ip, port)
            status = "Open" if result[1] else "Closed"
            service_name = port_services.get(str(port), "Unknown service")
            
            if status == "Open":
                open_ports.append(port)
                port_details.append({
                    "port": port, 
                    "status": status, 
                    "service": service_name
                })
            else:
                closed_ports.append(port)
        
        end_time = datetime.now()
        total_time = end_time - start_time
        
        return {
            "open_ports": open_ports, 
            "closed_ports": closed_ports, 
            "port_details": port_details,
            "total_time": str(total_time)
        }
    
    except Exception as e:
        return {"error": str(e)}

def check_http_status(url):
    try:
        if not url.startswith(('http://', 'https://')):
            url = 'https://' + url
        
        start_time = time.time()
        response = requests.get(url, timeout=10)
        response_time = round((time.time() - start_time) * 1000)  # in ms
        
        status_code = response.status_code
        
        status_messages = {
            200: "OK - Successful request",
            400: "Bad Request - Invalid argument",
            403: "Forbidden - Permission denied",
            429: "Resource Exhausted - Quota exceeded or rate limited",
            500: "Internal Server Error - Server error (retry request)",
            503: "Service Unavailable",
            504: "Gateway Timeout - Deadline exceeded (retry request)"
        }
        
        # Get server headers
        server_info = response.headers.get('Server', 'Unknown')
        content_type = response.headers.get('Content-Type', 'Unknown')
        content_length = response.headers.get('Content-Length', 'Unknown')
        
        return {
            "status_code": status_code,
            "message": status_messages.get(status_code, "Unknown Status"),
            "url": url,
            "response_time": response_time,
            "server": server_info,
            "content_type": content_type,
            "content_length": content_length
        }
    except requests.exceptions.RequestException as e:
        return {
            "status_code": None,
            "message": f"Error: {str(e)}",
            "url": url
        }
    
def monitor_remote_interface(target_ip): #
    def packet_callback(packet):
        if IP in packet and packet[IP].src == target_ip:
            return {
                'source_ip': packet[IP].src,
                'bytes_sent': len(packet),
                'protocol': packet.proto,
                'ttl': packet[IP].ttl
            }
    
    # Capture packets for the specific IP
    packets = sniff(filter=f"host {target_ip}", prn=packet_callback, timeout=5)
    return packets

@app.route('/api/client-info')
def get_client_info():
    client_ip = request.remote_addr
    client_info = {
        "ip": client_ip,
        "user_agent": request.headers.get('User-Agent'),
        "headers": dict(request.headers)
    }
    return jsonify(client_info)

@app.route('/api/remote-interface/<ip>')
def get_remote_interface(ip):
    interface_data = monitor_remote_interface(ip)
    return jsonify(interface_data) #   

@app.route('/api/check-status', methods=['POST'])
def check_status():
    data = request.get_json()
    url = data.get('url')
    if not url:
        return jsonify({"error": "URL is required"})
    
    result = check_http_status(url)
    return jsonify(result)    

@app.route('/http-checker')
def http_checker():
    return render_template('http-checker.html')

@app.route('/scanner')
def scanner():
    return render_template('scanner.html')

# Add these routes to your Flask app
@app.route('/api/scan', methods=['POST'])
def scan():
    data = request.get_json()
    target = data.get('target')
    start_port = int(data.get('start_port', 1))
    end_port = int(data.get('end_port', 100))
    
    result = port_scanner(target, start_port, end_port)
    return jsonify(result)

@app.route('/api/service/<port>')
def service_lookup(port):
    port_services = load_ports()
    service_name = port_services.get(str(port), "Unknown service")
    return jsonify({"service": service_name})    

# API Routes
@app.route('/api/ping/<host>')
def ping_route(host):
    result = ping_host(host)
    return jsonify({'result': result})

@app.route('/api/nslookup/<domain>')
def nslookup_route(domain):
    result = nslookup(domain)
    return jsonify({'result': result})

@app.route('/api/traceroute/<host>')
def traceroute_route(host):
    result = traceroute(host)
    return jsonify({'result': result})

# Background task for real-time updates
def background_task():
    while True:
        try:
            bandwidth_data = get_bandwidth_data()
            socketio.emit('bandwidth_update', bandwidth_data)
            
            interface_data = get_interface_info()
            socketio.emit('interface_update', interface_data)
            
            time.sleep(1)  # Added delay to prevent excessive updates
            
        except Exception as e:
            print(f"Error in background task: {e}")
            time.sleep(5)  # Wait longer if there's an error

if __name__ == '__main__':
    print("Server is running. Access the application at:")
    print("Local: http://127.0.0.1:5000")
    print("Network: http://[your-ip-address]:5000")
    socketio.start_background_task(background_task)
    socketio.run(app, debug=True, host='0.0.0.0', port=5000)