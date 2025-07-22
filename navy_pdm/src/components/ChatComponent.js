import Fab from "@mui/material/Fab";
import ChatIcon from "@mui/icons-material/Chat";
import CloseIcon from "@mui/icons-material/Close";
import SendIcon from "@mui/icons-material/Send";
import Paper from "@mui/material/Paper";
import TextField from "@mui/material/TextField";
import { useState } from "react";
import Button from "@mui/material/Button";

function ChatComponent(props) {
  const [isOpen, setIsOpen] = useState(false);
  function openDialog() {
    setIsOpen(true);
  }
  function closeDialog() {
    setIsOpen(false);
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
          <div>
            <CloseIcon
              onClick={closeDialog}
              style={{ display: "flex", color: "gray", padding: "10px" }}
            />
            <h1 style={{textAlign: "center"}}>Hello</h1>
          </div>
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
            <TextField
              style={{ width: "100%" }}
              id="outlined-basic"
              variant="outlined"
            />
            <Button style={{ gap: "10px", padding: "20px" }}>
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
        onClick={openDialog}
      >
        <ChatIcon />
      </Fab>
    </div>
  );
}

export default ChatComponent;
