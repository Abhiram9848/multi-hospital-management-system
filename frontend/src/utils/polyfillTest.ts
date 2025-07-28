// Test file to verify polyfills are working
export const testPolyfills = () => {
  console.log('Testing polyfills...');
  
  // Test process object
  if (typeof process !== 'undefined') {
    console.log('✅ process object available:', process.env);
  } else {
    console.error('❌ process object not available');
  }
  
  // Test Buffer object
  if (typeof Buffer !== 'undefined') {
    console.log('✅ Buffer object available');
  } else {
    console.error('❌ Buffer object not available');
  }
  
  // Test global object
  if (typeof global !== 'undefined') {
    console.log('✅ global object available');
  } else {
    console.error('❌ global object not available');
  }
  
  console.log('Polyfill test completed');
};
