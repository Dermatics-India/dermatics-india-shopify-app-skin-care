// import { useState, useEffect } from 'react';
// import { Page, Card, ColorPicker, TextField, Button } from '@shopify/polaris';
// import { hsbToHex } from '@shopify/polaris';

// // Safe hexToHsb helper
// const hexToHsbSafe = (hex) => {
//   try {
//     const hsb = require('@shopify/polaris').hexToHsb(hex);
//     return hsb;
//   } catch {
//     return null;
//   }
// };

// export default function Theme() {
//   const [textColor, setTextColor] = useState({ hue: 0, saturation: 0, brightness: 0.5 });
//   const [backgroundColor, setBackgroundColor] = useState({ hue: 0, saturation: 0, brightness: 0.95 });
//   const [buttonColor, setButtonColor] = useState({ hue: 200, saturation: 0.8, brightness: 0.7 });

//   const [textHex, setTextHex] = useState('');
//   const [backgroundHex, setBackgroundHex] = useState('');
//   const [buttonHex, setButtonHex] = useState('');

//   useEffect(() => setTextHex(hsbToHex(textColor)), [textColor]);
//   useEffect(() => setBackgroundHex(hsbToHex(backgroundColor)), [backgroundColor]);
//   useEffect(() => setButtonHex(hsbToHex(buttonColor)), [buttonColor]);

//   const handleHexChange = (value, setHex, setColor) => {
//     setHex(value);
//     const hsb = hexToHsbSafe(value);
//     if (hsb) setColor(hsb);
//   };

//   const save = async () => {
//     // save API call
//   };

//   return (
//     <Page title="Theme Customization">
//       <Card sectioned>
//         <div style={styles.row}>
//           {/* Text Color */}
//           <div style={styles.colorBlock}>
//             <label style={styles.label}>Text Color</label>
//             <ColorPicker color={textColor} onChange={setTextColor} />
//             <TextField
//               value={textHex}
//               onChange={(v) => handleHexChange(v, setTextHex, setTextColor)}
//               labelHidden
//               style={styles.textField}
//             />
//           </div>

//           {/* Background Color */}
//           <div style={styles.colorBlock}>
//             <label style={styles.label}>Background Color</label>
//             <ColorPicker color={backgroundColor} onChange={setBackgroundColor} />
//             <TextField
//               value={backgroundHex}
//               onChange={(v) => handleHexChange(v, setBackgroundHex, setBackgroundColor)}
//               labelHidden
//               style={styles.textField}
//             />
//           </div>

//           {/* Button Color */}
//           <div style={styles.colorBlock}>
//             <label style={styles.label}>Button Color</label>
//             <ColorPicker color={buttonColor} onChange={setButtonColor} />
//             <TextField
//               value={buttonHex}
//               onChange={(v) => handleHexChange(v, setButtonHex, setButtonColor)}
//               labelHidden
//               style={styles.textField}
//             />
//           </div>
//         </div>

//         {/* Save Button */}
//         <div style={{ textAlign: 'center', marginTop: 20 }}>
//           <Button primary onClick={save} size="large">Save</Button>
//         </div>
//       </Card>
//     </Page>
//   );
// }

// const styles = {
//   row: {
//     display: 'flex',
//     justifyContent: 'space-between',
//     gap: '30px',
//     flexWrap: 'wrap',
//   },
//   colorBlock: {
//     flex: '1 1 30%',
//     minWidth: '280px',
//     display: 'flex',
//     flexDirection: 'column',
//     gap: '12px',
//   },
//   label: {
//     fontWeight: 600,
//     fontSize: '18px',
//     marginBottom: '10px',
//     alignSelf: 'flex-start',
//   },
//   textField: {
//     height: '36px', // Make text field a bit taller
//   }
// };

// web/frontend/pages/Theme.jsx (Example additions)

// web/frontend/pages/Theme.jsx

// web/frontend/pages/Theme.jsx

// web/frontend/pages/Theme.jsx

import { useState, useEffect } from 'react';
import { 
  Page, 
  Card, 
  ColorPicker, 
  TextField, 
  Button, 
  Grid, 
  Text, 
  Stack, 
  RangeSlider, 
  Select,
  FormLayout,
  Layout, 
  // All color utility imports MUST be removed from this line
} from '@shopify/polaris';

// ================================================================
// FIX: Self-Contained Color Utility Functions (Bypass Import Error)
// These functions perform the same role as hsbToHex and hexToHsb.
// Source: Simplified logic based on Polaris color utilities.
// ================================================================

function hsbToHex(hsb) {
  let r, g, b;
  let h = hsb.hue / 360;
  let s = hsb.saturation;
  let v = hsb.brightness;

  let i = Math.floor(h * 6);
  let f = h * 6 - i;
  let p = v * (1 - s);
  let q = v * (1 - f * s);
  let t = v * (1 - (1 - f) * s);

  switch (i % 6) {
    case 0: r = v; g = t; b = p; break;
    case 1: r = q; g = v; b = p; break;
    case 2: r = p; g = v; b = t; break;
    case 3: r = p; g = q; b = v; break;
    case 4: r = t; g = p; b = v; break;
    case 5: r = v; g = p; b = q; break;
    default: r = g = b = 0; // Should not happen
  }

  let toHex = (c) => {
    let hex = Math.round(c * 255).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

// Simplified hexToHsb function (focusing on conversion for the picker to work)
function hexToHsb(hex) {
    if (!/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.test(hex)) {
        return null; // Invalid hex
    }
    hex = hex.replace('#', '');

    let r = parseInt(hex.substring(0, 2), 16) / 255;
    let g = parseInt(hex.substring(2, 4), 16) / 255;
    let b = parseInt(hex.substring(4, 6), 16) / 255;

    let max = Math.max(r, g, b);
    let min = Math.min(r, g, b);
    let h, s, v = max;

    let delta = max - min;
    s = max === 0 ? 0 : delta / max;

    if (max === min) {
        h = 0; // achromatic
    } else {
        switch (max) {
            case r: h = (g - b) / delta + (g < b ? 6 : 0); break;
            case g: h = (b - r) / delta + 2; break;
            case b: h = (r - g) / delta + 4; break;
            default: h = 0;
        }
        h /= 6;
    }

    return { 
        hue: Math.round(h * 360), 
        saturation: s, 
        brightness: v
    };
}

// ================================================================

export default function Theme() {
  // --- 1. STATE MANAGEMENT ---
  
  const [textColor, setTextColor] = useState({ hue: 0, saturation: 0, brightness: 0.5 });
  const [backgroundColor, setBackgroundColor] = useState({ hue: 0, saturation: 0, brightness: 0.95 });
  const [buttonColor, setButtonColor] = useState({ hue: 200, saturation: 0.8, brightness: 0.7 });

  const [textHex, setTextHex] = useState(hsbToHex(textColor));
  const [backgroundHex, setBackgroundHex] = useState(hsbToHex(backgroundColor));
  const [buttonHex, setButtonHex] = useState(hsbToHex(buttonColor));

  const [borderRadius, setBorderRadius] = useState(4); 
  const [fontFamily, setFontFamily] = useState('Theme Default');
  const [saving, setSaving] = useState(false);


  // --- 2. EFFECTS (SYNC HSB to HEX) ---
  useEffect(() => setTextHex(hsbToHex(textColor)), [textColor]);
  useEffect(() => setBackgroundHex(hsbToHex(backgroundColor)), [backgroundColor]);
  useEffect(() => setButtonHex(hsbToHex(buttonColor)), [buttonColor]);


  // --- 3. HANDLERS ---

  const handleHexChange = (value, setHex, setColor) => {
    setHex(value);
    try {
      const hsb = hexToHsb(value); 
      if (hsb) setColor(hsb);
    } catch (e) {
      // Ignored: handles partial hex string input
    }
  };

  const save = async () => {
    setSaving(true);
    console.log('Saving theme settings:', {
      textColor: textHex,
      backgroundColor: backgroundHex,
      buttonColor: buttonHex,
      borderRadius: `${borderRadius}px`,
      fontFamily: fontFamily,
    });
    
    // Placeholder API call
    await new Promise(resolve => setTimeout(resolve, 1000)); 
    setSaving(false);
  };


  // --- 4. OPTIONS & HELPERS ---
  
  const fontOptions = [
    { label: 'Use Theme Default', value: 'Theme Default' },
    { label: 'System Sans-Serif', value: 'system' },
    { label: 'Serif (Times)', value: 'serif' },
  ];
  
  // Helper component to structure each color setting cleanly
  const ColorSetting = ({ label, color, setColor, hex, setHex }) => (
    <Stack vertical spacing="tight">
      <Text variant="headingMd" as="h2">{label}</Text>
      <ColorPicker color={color} onChange={setColor} />
      <TextField
        value={hex}
        onChange={(v) => handleHexChange(v, setHex, setColor)}
        labelHidden
        autoComplete="off"
        // Show current color below TextField
        connectedRight={<div style={{ width: '30px', height: '100%', backgroundColor: hex, borderRadius: '0 4px 4px 0', border: '1px solid #c9ccce' }}></div>}
      />
    </Stack>
  );

  return (
    <Page title="Theme Customization">
      <Layout>
        
        {/* SECTION 1: COLOR CONTROLS */}
        <Layout.Section>
          <Card title="Color Palette" sectioned>
            <Grid>
              {/* Text Color */}
              <Grid.Cell columnSpan={{ xs: 6, sm: 6, md: 4, lg: 4, xl: 4 }}>
                <ColorSetting 
                  label="Text Color" 
                  color={textColor} 
                  setColor={setTextColor} 
                  hex={textHex} 
                  setHex={setTextHex} 
                />
              </Grid.Cell>

              {/* Background Color */}
              <Grid.Cell columnSpan={{ xs: 6, sm: 6, md: 4, lg: 4, xl: 4 }}>
                <ColorSetting 
                  label="Background Color" 
                  color={backgroundColor} 
                  setColor={setBackgroundColor} 
                  hex={backgroundHex} 
                  setHex={setBackgroundHex} 
                />
              </Grid.Cell>

              {/* Button Color */}
              <Grid.Cell columnSpan={{ xs: 6, sm: 6, md: 4, lg: 4, xl: 4 }}>
                <ColorSetting 
                  label="Button Color" 
                  color={buttonColor} 
                  setColor={setButtonColor} 
                  hex={buttonHex} 
                  setHex={setButtonHex} 
                />
              </Grid.Cell>
            </Grid>
          </Card>
        </Layout.Section>

        {/* SECTION 2: TYPOGRAPHY AND LAYOUT */}
        <Layout.Section>
          <Card title="Typography and Styling" sectioned>
            <FormLayout>
              
              {/* Font Family Control */}
              <Select
                label="Font Family"
                options={fontOptions}
                value={fontFamily}
                onChange={setFontFamily}
                helpText="Choose a font to match your store's branding."
              />

              {/* Border Radius Control */}
              <RangeSlider
                label="Corner Roundness (Border Radius)"
                value={borderRadius}
                onChange={setBorderRadius}
                min={0}
                max={16}
                step={2}
                output
                helpText={`Current radius: ${borderRadius}px`}
              />
              
            </FormLayout>
          </Card>
        </Layout.Section>

        {/* SAVE BUTTON */}
        <Layout.Section>
            <Stack distribution="trailing">
              <Button primary onClick={save} loading={saving} size="large">
                Save Theme Settings
              </Button>
            </Stack>
        </Layout.Section>
        
      </Layout>
    </Page>
  );
}