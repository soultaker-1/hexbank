from flask import Flask, request, jsonify, render_template
import mysql.connector
import bcrypt
from datetime import datetime
from flask_cors import CORS

app = Flask(__name__, template_folder='templates')
CORS(app)

# Database connection
try:
    db = mysql.connector.connect(
        host="localhost",
        user="root",
        password="Nihal2013*",  # Replace with your MySQL password
        database="test1"
    )
    cursor = db.cursor()
    print("Database connected successfully")
except mysql.connector.Error as err:
    print(f"Database connection error: {err}")
    exit(1)

def check(id):
    try:
        sql = "SELECT points FROM test2 WHERE id = %s;"
        cursor.execute(sql, [id])
        total = cursor.fetchall()
        if not total:
            print(f"No user found for id={id}")
            return 0
        return total[0][0]
    except mysql.connector.Error as err:
        print(f"Error in check: {err}")
        return 0

def history_subtract(debit, id):
    try:
        time = datetime.now().strftime("%H:%M:%S")
        date = datetime.now().strftime("%y/%m/%d")
        total = check(id)
        sql = "INSERT INTO history (id, creadit, debit, date, time, total) VALUES (%s, %s, %s, %s, %s, %s)"
        val = (id, 0, debit, date, time, total)
        cursor.execute(sql, val)
        db.commit()
        print(f"History subtract recorded: id={id}, debit={debit}, date={date}, time={time}, total={total}")
        return True
    except mysql.connector.Error as err:
        print(f"Error in history_subtract: {err}")
        return False

def history_add(creadit, id):
    try:
        time = datetime.now().strftime("%H:%M:%S")
        date = datetime.now().strftime("%y/%m/%d")
        total = check(id)
        sql = "INSERT INTO history (id, creadit, debit, date, time, total) VALUES (%s, %s, %s, %s, %s, %s)"
        val = (id, creadit, 0, date, time, total)
        cursor.execute(sql, val)
        db.commit()
        print(f"History add recorded: id={id}, creadit={creadit}, date={date}, time={time}, total={total}")
        return True
    except mysql.connector.Error as err:
        print(f"Error in history_add: {err}")
        return False

@app.route('/')
def index():
    return render_template('signin.html')

@app.route('/points')
def points_page():
    return render_template('points.html')

@app.route('/sname', methods=['POST'])
def sname():
    data = request.json
    fname, lname = data['fname'], data['lname']
    try:
        sql = "SELECT * FROM test2 WHERE fname = %s AND lname = %s;"
        cursor.execute(sql, (fname, lname))
        result = cursor.fetchall()
        return jsonify({'exists': len(result) > 0})
    except mysql.connector.Error as err:
        print(f"Error in sname: {err}")
        return jsonify({'exists': False})

@app.route('/id', methods=['GET'])
def get_id():
    try:
        cursor.execute("SELECT COUNT(*) FROM test2;")
        count = cursor.fetchall()[0][0]
        return jsonify({'id': count + 1})
    except mysql.connector.Error as err:
        print(f"Error in get_id: {err}")
        return jsonify({'id': 1})

@app.route('/signup', methods=['POST'])
def signup():
    data = request.json
    fname, lname, password = data['fname'], data['lname'], data['password']
    try:
        hashed = bcrypt.hashpw(password.encode(), bcrypt.gensalt())
        sql = "INSERT INTO test2 (id, fname, lname, password, points) VALUES (%s, %s, %s, %s, %s);"
        val = (data['id'], fname, lname, hashed, 0)
        cursor.execute(sql, val)
        db.commit()
        print(f"Signup successful: id={data['id']}, fname={fname}")
        return jsonify({'success': True})
    except mysql.connector.Error as err:
        print(f"Error in signup: {err}")
        return jsonify({'success': False})

@app.route('/signin', methods=['POST'])
def signin():
    data = request.json
    fname, lname, password = data['fname'], data['lname'], data['password']
    try:
        sql = "SELECT password, id FROM test2 WHERE fname = %s AND lname = %s;"
        cursor.execute(sql, (fname, lname))
        result = cursor.fetchall()
        if result and bcrypt.checkpw(password.encode(), result[0][0].encode()):
            print(f"Signin successful: id={result[0][1]}, fname={fname}")
            return jsonify({'success': True, 'id': result[0][1], 'fname': fname})
        print("Signin failed: incorrect credentials")
        return jsonify({'success': False})
    except mysql.connector.Error as err:
        print(f"Error in signin: {err}")
        return jsonify({'success': False})

@app.route('/points/total', methods=['GET'])
def total_points():
    try:
        cursor.execute("SELECT SUM(points) FROM test2;")
        total = cursor.fetchall()[0][0] or 0
        return jsonify({'total': total})
    except mysql.connector.Error as err:
        print(f"Error in total_points: {err}")
        return jsonify({'total': 0})

@app.route('/points/<int:id>', methods=['GET'])
def check_balance(id):
    try:
        balance = check(id)
        print(f"Balance checked: id={id}, points={balance}")
        return jsonify({'points': balance})
    except mysql.connector.Error as err:
        print(f"Error in check_balance: {err}")
        return jsonify({'points': 0})

@app.route('/points/add/<int:id>', methods=['POST'])
def add_points(id):
    data = request.json
    amount = data.get('amount')
    print(f"Add points request: id={id}, amount={amount}")
    try:
        cursor.execute("SELECT SUM(points) FROM test2;")
        total = cursor.fetchall()[0][0] or 0
        if total >= 100000:
            print("Add failed: no points available")
            return jsonify({'success': False, 'message': 'No points available'})
        if amount > (100000 - total):
            print(f"Add failed: amount={amount} exceeds available={100000-total}")
            return jsonify({'success': False, 'message': 'Points exceed available'})
        if amount <= 0:
            print(f"Add failed: invalid amount={amount}")
            return jsonify({'success': False, 'message': 'Invalid value'})
        sql = "UPDATE test2 SET points = points + %s WHERE id = %s;"
        cursor.execute(sql, (amount, id))
        db.commit()
        if history_add(amount, id):
            print(f"Add points successful: id={id}, amount={amount}")
            return jsonify({'success': True})
        else:
            print("Add failed: history insert failed")
            return jsonify({'success': False, 'message': 'History update failed'})
    except mysql.connector.Error as err:
        print(f"Error in add_points: {err}")
        return jsonify({'success': False, 'message': 'Transaction failed'})

@app.route('/points/subtract/<int:id>', methods=['POST'])
def subtract_points(id):
    data = request.json
    amount = data.get('amount')
    print(f"Subtract points request: id={id}, amount={amount}")
    try:
        balance = check(id)
        if amount > balance:
            print(f"Subtract failed: amount={amount} exceeds balance={balance}")
            return jsonify({'success': False, 'message': 'Insufficient balance'})
        if amount <= 0:
            print(f"Subtract failed: invalid amount={amount}")
            return jsonify({'success': False, 'message': 'Invalid value'})
        sql = "UPDATE test2 SET points = points - %s WHERE id = %s;"
        cursor.execute(sql, (amount, id))
        db.commit()
        if history_subtract(amount, id):
            print(f"Subtract points successful: id={id}, amount={amount}")
            return jsonify({'success': True})
        else:
            print("Subtract failed: history insert failed")
            return jsonify({'success': False, 'message': 'History update failed'})
    except mysql.connector.Error as err:
        print(f"Error in subtract_points: {err}")
        return jsonify({'success': False, 'message': 'Transaction failed'})

@app.errorhandler(404)
def not_found(error):
    print(f"404 error: {request.url}")
    return jsonify({'error': 'Not found'}), 404

if __name__ == '__main__':
    app.run(debug=True)