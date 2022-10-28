// @flow
import { useState, useEffect } from "react";

import clsx from "clsx";
import "./styles.css";


function LayoutContainer({ id, size, hidden, screen }){
  const [ isBig, setIsBig ] = useState<boolean>(true);

  useEffect(() => {
    setIsBig(size === "big");
  }, [ size ]);

  return (
    <div id={id} className={clsx(
      "layoutContainer",
      (isBig)? "big" : "",
      (hidden)? "hidden" : "",
      (screen)? "screen" : ""
    )}/>
  );
}
export default LayoutContainer;