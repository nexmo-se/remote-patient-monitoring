// @flow
import LM from "opentok-layout-js";

class LayoutManager{

  constructor(container, manager){
    this.container = container;
    this.manager = manager;
  }

  init(){
    const element = document.getElementById(this.container);
    if(element) this.manager = LM(element, { 
      fixedRatio: true, 
      scaleLastRow: false,
      bigFirst: false,
      bigFixedRatio: true,
      bigAlignItems: "left"
    });
    else throw new Error("Cannot find container");
  }

  layout(){
    if(!this.manager) this.init();
    this.manager.layout();
  }
}
export default LayoutManager;