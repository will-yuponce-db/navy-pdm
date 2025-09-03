import * as React from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import Modal from "@mui/material/Modal";
import TextField from "@mui/material/TextField";

const style = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: 400,
  bgcolor: "background.paper",
  borderRadius: "10px",
  boxShadow: 24,
  p: 4,
};

export default function WorkOrderModal(props) {
  return (
    <div>
      <Modal
        open={props.modalOpen}
        onClose={props.handleModalClose}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
      >
        <Box sx={style}>
          <Typography id="modal-modal-title" variant="h6" component="h2">
            Create Work Order
          </Typography>
          <div
            style={{
              display: "flex",
              gap: "20px",
              flexDirection: "row",
              paddingTop: "20px",
            }}
          >
            <TextField id="outlined-basic" label="Ship" variant="outlined" />
            <TextField
              id="outlined-basic"
              label="Homeport"
              variant="outlined"
            />
          </div>
          <div
            style={{
              display: "flex",
              gap: "20px",
              flexDirection: "row",
              paddingTop: "20px",
            }}
          >
            <TextField
              id="outlined-basic"
              label="GTE / System"
              variant="outlined"
            />
            <TextField
              id="outlined-basic"
              label="Failure Mode"
              variant="outlined"
            />
          </div>
          <div
            style={{
              display: "flex",
              gap: "20px",
              flexDirection: "row",
              paddingTop: "20px",
            }}
          >
            <TextField
              id="outlined-basic"
              label="Priority"
              variant="outlined"
            />
            <TextField
              id="outlined-basic"
              label="Target ETA (days)"
              variant="outlined"
            />
          </div>
          <div
            style={{
              display: "flex",
              paddingTop: "20px",
              gap: "20px",
              flexDirection: "column",
            }}
          >
            <TextField
              id="outlined-textarea"
              label="Observed Symptoms"
              multiline
            />
            <TextField
              id="outlined-textarea"
              label="Recommended Action"
              multiline
            />
          </div>
          <div
            style={{
              display: "flex",
              gap: "20px",
              paddingTop: "20px",
              flexDirection: "row",
            }}
          >
            <TextField
              id="outlined-basic"
              label="Parts Required"
              variant="outlined"
            />
            <TextField
              id="outlined-basic"
              label="SLA Category"
              variant="outlined"
            />
          </div>
          <div
            style={{
              paddingTop: "20px",
              display: "flex",
              gap: "20px",
              flexDirection: "row",
              justifyContent: "flex-end",
            }}
          >
            <Button variant="outlined" color="secondary" onClick={props.handleModalClose}>
              Cancel
            </Button>
            <Button variant="contained" color="primary">
              Submit
            </Button>
          </div>
        </Box>
      </Modal>
    </div>
  );
}
