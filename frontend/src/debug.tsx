const DEBUG = true;
const debugLog = (props: any) => {
  if (DEBUG) {
    const logBody = Object.entries(props)
      .map(([key, value]) => `${key}: ${value}`)
      .join("\n  ");

    console.log(`{\n  ${logBody}\n}`);
  }
  //DEBUG && console.log(props);
};

export default debugLog;
