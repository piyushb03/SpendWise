# SpendWise — Expense Tracker Application

A modern, responsive expense tracking app to manage your finances in real-time.

<img width="1905" height="841" alt="image" src="https://github.com/user-attachments/assets/51dee916-f270-4e83-8fdf-d758e73e36c6" />



## 📋 Features

- Smart dashboard with interactive charts (Chart.js)
- Track income and expenses with categories
- Real-time net balance calculation
- Dark mode support with glassmorphism design
- Recycle bin for safe deletion and restoration
- Secure authentication with password encryption
- Fully responsive design for all devices

## 🛠️ Tech Stack

**Frontend:**
- HTML5, CSS3, JavaScript (ES6+)
- Tailwind CSS (CDN)
- Chart.js
- FontAwesome

**Backend:**
- Flask
- Flask-SQLAlchemy (SQLite)
- Flask-CORS
- Werkzeug Security

## 📁 Repository Structure

```
SpendWise/
├── Backend/
│   ├── app.py
│   ├── pro_database.db
│   └── requirements.txt
└── Frontend/
    ├── index.html
    ├── style.css
    └── script.js
```

## 🚀 Installation

### Prerequisites
- Python 3.8+
- Modern web browser

### Local Setup

1. **Clone the repository**
```bash
git clone https://github.com/piyushb03/SpendWise.git
cd SpendWise
```

2. **Backend Setup**
```bash
cd Backend
pip install -r requirements.txt
python app.py
```
Server runs at `http://127.0.0.1:5000`

3. **Frontend Setup**

Update `Frontend/script.js`:
```javascript
const API_URL = "http://127.0.0.1:5000/api";
```

Open `Frontend/index.html` in your browser.

## 📸 Screenshots

<img width="1919" height="1072" alt="image" src="https://github.com/user-attachments/assets/ff48ea69-c5aa-4489-a67e-72713b8025a7" />


### Dashboard
<img width="1905" height="841" alt="image" src="https://github.com/user-attachments/assets/99ad6281-0ea7-4be4-938d-34f487aeb0d9" />


### Transaction Management
<img width="1904" height="840" alt="image" src="https://github.com/user-attachments/assets/fbefec95-eba2-4958-a000-5d9c7a4c8f60" />


### Settings
<img width="1906" height="833" alt="image" src="https://github.com/user-attachments/assets/9c96cb1b-52f0-454d-bec7-b04765455919" />


---

## 🚀 Quick Start

```bash
# Clone the repository
git clone https://github.com/piyushb03/SpendWise.git
cd SpendWise

# Backend setup
cd Backend
pip install -r requirements.txt
python app.py

# Frontend setup
cd ../Frontend
# Update API_URL in script.js to http://127.0.0.1:5000/api
# Open index.html in browser
```

---

## 📡 API Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/register` | Create new user | No |
| POST | `/api/login` | User login | No |
| GET | `/api/dashboard/<id>` | Get dashboard data | Yes |
| POST | `/api/expenses` | Add transaction | Yes |
| PUT | `/api/expenses/<id>` | Update transaction | Yes |
| DELETE | `/api/expenses/<id>` | Soft delete transaction | Yes |
| GET | `/api/trash/<id>` | Get deleted items | Yes |
| POST | `/api/restore/<id>` | Restore transaction | Yes |

---

## 🚀 Deployment

**Backend (PythonAnywhere)**
```bash
pip3.10 install --user flask flask-sqlalchemy flask-cors werkzeug
# Configure WSGI file → point to app.py → reload
```

**Frontend (Vercel/Netlify)**
```javascript
// Update Frontend/script.js
const API_URL = "https://yourusername.pythonanywhere.com/api";
```
Push to GitHub and deploy via Vercel/Netlify dashboard.

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 👤 Author

**Piyush Baghel**
- GitHub: [@piyushb03](https://github.com/piyushb03)
- Project Link: [https://github.com/piyushb03/SpendWise](https://github.com/piyushb03/SpendWise)

---

<div align="center">

**⭐ If you found this project helpful, please give it a star! ⭐**

Made with ❤️ by Piyush Baghel

</div>
