import pandas as pd
from flask import Flask, render_template
import logging

log = logging.getLogger("werkzeug")
log.setLevel(logging.ERROR)

dod_dashboard_url = "https://e2-demo-field-eng.cloud.databricks.com/embed/dashboardsv3/01f051dbbeaa1ba3a285031bf1ecf85c?o=1444828305810485"
pubsec_dashboard_url = "https://e2-demo-field-eng.cloud.databricks.com/embed/dashboardsv3/01f063eee154119f99b398347430eb90?o=1444828305810485"

flask_app = Flask(__name__)


@flask_app.route("/")
def pdm_demo():
    return render_template(
        "index.html",
        dod_dashboard_url=dod_dashboard_url,
        pubsec_dashboard_url=pubsec_dashboard_url,
    )


if __name__ == "__main__":
    flask_app.run(debug=True)
