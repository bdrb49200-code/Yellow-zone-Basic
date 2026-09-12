
from flask import Flask, render_template, request, redirect, url_for, flash
import sqlite3
from pathlib import Path

app = Flask(__name__)
app.secret_key = "change-this-secret-key"
DB = Path(__file__).with_name("factory.db")

def db():
    con = sqlite3.connect(DB)
    con.row_factory = sqlite3.Row
    return con

def init_db():
    con = db()
    con.executescript("""
    CREATE TABLE IF NOT EXISTS products (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        category TEXT NOT NULL,
        description TEXT DEFAULT '',
        price TEXT DEFAULT ''
    );
    CREATE TABLE IF NOT EXISTS quotes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        phone TEXT NOT NULL,
        company TEXT DEFAULT '',
        message TEXT DEFAULT '',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    """)
    if con.execute("SELECT COUNT(*) FROM products").fetchone()[0] == 0:
        con.executemany(
            "INSERT INTO products(name,category,description,price) VALUES(?,?,?,?)",
            [
                ("منتج صناعي A","حلول صناعية","حل صناعي تجريبي","حسب الطلب"),
                ("منتج صناعي B","معدات وتجهيزات","معدات وتجهيزات للمصانع","حسب الطلب"),
                ("منتج صناعي C","أنظمة إنتاج","أنظمة إنتاج قابلة للتخصيص","حسب الطلب"),
                ("منتج صناعي D","مستلزمات المصانع","مستلزمات ومكونات صناعية","حسب الطلب"),
            ]
        )
    con.commit()
    con.close()

@app.route("/")
def home():
    con = db()
    products = con.execute("SELECT * FROM products ORDER BY id DESC").fetchall()
    con.close()
    return render_template("index.html", products=products)

@app.post("/quote")
def quote():
    name = request.form.get("name","").strip()
    phone = request.form.get("phone","").strip()
    company = request.form.get("company","").strip()
    message = request.form.get("message","").strip()
    if not name or not phone:
        flash("الاسم ورقم الجوال مطلوبان.")
        return redirect(url_for("home") + "#contact")
    con = db()
    con.execute(
        "INSERT INTO quotes(name,phone,company,message) VALUES(?,?,?,?)",
        (name, phone, company, message)
    )
    con.commit()
    con.close()
    flash("تم إرسال طلب عرض السعر بنجاح.")
    return redirect(url_for("home") + "#contact")

@app.route("/admin")
def admin():
    con = db()
    products = con.execute("SELECT * FROM products ORDER BY id DESC").fetchall()
    quotes = con.execute("SELECT * FROM quotes ORDER BY created_at DESC").fetchall()
    con.close()
    return render_template("admin.html", products=products, quotes=quotes)

@app.post("/admin/product")
def add_product():
    name = request.form.get("name","").strip()
    category = request.form.get("category","").strip()
    description = request.form.get("description","").strip()
    price = request.form.get("price","").strip()
    if name and category:
        con = db()
        con.execute(
            "INSERT INTO products(name,category,description,price) VALUES(?,?,?,?)",
            (name, category, description, price)
        )
        con.commit()
        con.close()
    return redirect(url_for("admin"))

@app.post("/admin/product/<int:product_id>/delete")
def delete_product(product_id):
    con = db()
    con.execute("DELETE FROM products WHERE id=?", (product_id,))
    con.commit()
    con.close()
    return redirect(url_for("admin"))

if __name__ == "__main__":
    init_db()
    app.run(debug=True)
