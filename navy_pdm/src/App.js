import "./App.css";
import { useState } from "react";
import LabeledSwitch from "./components/LabeledSwitch";
import ChatComponent from "./components/ChatComponent";

function App() {
  const [isToggled, setToggled] = useState(true);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);

  const sendMessage = (e) => {
    e.preventDefault();
    if (message) {
    }
  };

  return (
    <div className="App">
      <LabeledSwitch
        buttonLabelLeft="DoD Dashboard"
        buttonLabelRight="Public Sector Dashboard"
        handleButtonState={setToggled}
      />
      {isToggled && (
        <iframe
          style={{
            height: "100vh",
            width: "100%",
          }}
          src="https://e2-demo-field-eng.cloud.databricks.com/embed/dashboardsv3/01f063eee154119f99b398347430eb90?o=1444828305810485"
          frameborder="0"
        ></iframe>
      )}
      {!isToggled && (
        <iframe
          style={{
            height: "100vh",
            width: "100%",
          }}
          src="https://e2-demo-field-eng.cloud.databricks.com/embed/dashboardsv3/01f051dbbeaa1ba3a285031bf1ecf85c?o=1444828305810485"
          frameborder="0"
        ></iframe>
      )}
      <ChatComponent />
    </div>
  );
}

export default App;
