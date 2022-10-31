import { useState, useEffect } from "react";
import clsx from "clsx";
import "./styles.css";

function LayoutContainer({ id, size, hidden }){
  const [ isBig, setIsBig ] = useState(true);
  useEffect(() => {
      setIsBig(size === "big");
  }, [ size ]);

  return (
    <div id={id} className={clsx(
      "layoutContainer",
       (isBig)? "big" : "",
       (hidden)? "hidden" : ""
    )}/>
  );
}
export default LayoutContainer;