from app import app

@app.route('/')
def landing():
    return 'Landing page is working!'

@app.route('/test')
def test():
    return 'Test route is working!'