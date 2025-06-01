const VEGA_SPECS_URL = '/spec/vega/index.json';
const VEGA_LITE_SPECS_URL = '/spec/vega-lite/index.json';

let VEGA_SPECS: any = null;
let VEGA_LITE_SPECS: any = null;

export async function loadSpecs() {
  try {
    const [vegaResponse, vegaLiteResponse] = await Promise.all([fetch(VEGA_SPECS_URL), fetch(VEGA_LITE_SPECS_URL)]);

    VEGA_SPECS = await vegaResponse.json();
    VEGA_LITE_SPECS = await vegaLiteResponse.json();

    return {VEGA_SPECS, VEGA_LITE_SPECS};
  } catch (error) {
    console.error('Failed to load specs:', error);
    VEGA_SPECS = {};
    VEGA_LITE_SPECS = {};
    return {VEGA_SPECS, VEGA_LITE_SPECS};
  }
}

export {VEGA_SPECS, VEGA_LITE_SPECS};
