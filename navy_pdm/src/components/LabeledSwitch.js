import Switch from "@mui/material/Switch";
import Typography from "@mui/material/Typography";

function LabeledSwitch(props) {
  function toggleButton(event) {
    props.handleButtonState(event.target.checked);
  }

  return (
    <div className="LabeledSwitch">
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "flex-end",
        }}
      >
        <Typography>{props.buttonLabelLeft}</Typography>
        <Switch onChange={toggleButton} defaultChecked />
        <Typography>{props.buttonLabelRight}</Typography>
      </div>
    </div>
  );
}

export default LabeledSwitch;
