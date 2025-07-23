import Fab from "@mui/material/Fab";
import ChatIcon from "@mui/icons-material/Chat";
import CloseIcon from "@mui/icons-material/Close";
import SendIcon from "@mui/icons-material/Send";
import Paper from "@mui/material/Paper";
import TextField from "@mui/material/TextField";
import { useState } from "react";
import Chip from "@mui/material/Chip";
import Stack from "@mui/material/Stack";
import Button from "@mui/material/Button";
import Divider from "@mui/material/Divider";
import Box from "@mui/material/Box";
import FormControl from "@mui/material/FormControl";
import axios from "axios";
function ChatComponent(props) {
  const [chatMessages, setChatMessages] = useState([]);
  const [messageNumber, setMessageNumber] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [chatField, setChatField] = useState("");
  function toggleDialog() {
    setIsOpen(!isOpen);
  }
  function formInput(event) {
    setChatField(event.target.value);
  }
  function closeDialog() {
    setIsOpen(false);
  }

  function sendMessage(event) {
    appendMessage({ text: chatField, isUser: true });
    axios
      .post(
        "https://e2-demo-field-eng.cloud.databricks.com/api/2.0/genie/spaces/01f055d6ca9f1bf59693113af3d9280f/start-conversation",
        {
          content: chatField,
        },
        {
          //Adding token to the request
          headers: {
            Authorization: "Bearer dapi8a974c6446ea7534a358355ee4e8b56a", //gitleaks:allow
            "Access-Control-Allow-Origin": "*",
            "Content-Type": "application/json",
            "Access-Control-Allow-Methods": "POST, GET, OPTIONS, DELETE",
            "Access-Control-Allow-Headers": "Content-Type, x-requested-with",
          },
        }
      )
      .catch((e) => {
        console.log(e);
      });
    setChatField("");
  }
  function appendMessage(message) {
    setChatMessages([...chatMessages, message]);
  }
  return (
    <div className="ChatComponent">
      {isOpen && (
        <Paper
          style={{
            height: "600px",
            width: "500px",
            background: "rgba(255, 255, 255, 1)",
            position: "absolute",
            bottom: "90px",
            right: "20px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center" }}>
            <CloseIcon
              onClick={closeDialog}
              style={{ display: "flex", color: "gray", padding: "10px" }}
            />
            <p1
              style={{
                position: "absolute",
                left: "110px",
                textAlign: "center",
              }}
            >
              Databricks Predictive Maintenance Genie
            </p1>
          </div>
          <Divider variant="middle" />
          <Stack direction="column" style={{ margin: "10px" }} spacing={2}>
            {chatMessages.map((message) => {
              if (message.isUser) {
                return (
                  <Chip
                    sx={{
                      height: "auto",
                      "& .MuiChip-label": {
                        display: "block",
                        whiteSpace: "normal",
                      },
                    }}
                    label={message.text}
                    style={{ marginLeft: "100px" }}
                  />
                );
              } else {
                return (
                  <Chip
                    sx={{
                      height: "auto",
                      "& .MuiChip-label": {
                        display: "block",
                        whiteSpace: "normal",
                      },
                    }}
                    label={message.text}
                    style={{ marginRight: "100px" }}
                    variant="outlined"
                  />
                );
              }
            })}
          </Stack>
          <div
            style={{
              display: "flex",
              padding: "20px",
              bottom: "0px",
              boxSizing: "border-box",
              width: "100%",
              position: "absolute",
              display: "flex",
              justifyContent: "space-around",
              alignItems: "center",
              gap: "10px",
            }}
          >
            <FormControl style={{ width: "100%" }}>
              <TextField
                onChange={formInput}
                id="outlined-basic"
                variant="outlined"
                value={chatField}
              />
            </FormControl>

            <Button
              onClick={sendMessage}
              style={{ gap: "10px", padding: "20px" }}
            >
              Send
              <SendIcon />
            </Button>
          </div>
        </Paper>
      )}
      <Fab
        style={{
          right: "20px",
          bottom: "20px",
          position: "absolute",
        }}
        color="primary"
        aria-label="add"
        onClick={toggleDialog}
      >
        <ChatIcon />
      </Fab>
    </div>
  );
}

export default ChatComponent;
