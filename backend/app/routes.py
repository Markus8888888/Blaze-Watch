from app import app

@app.route('/test')
def test():
    return 'Test route is working!'