async function charbychar(char, delay) {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        try {
          console.log(char);
          resolve();
        } catch (error) {
          reject(error);
        }
      }, delay);
    });
  }
  
  const value = 'This is a playground.';
  const delay = 1000; // Delay in milliseconds between each character
  
  async function printValue() {
    for (const char of value) {
      try {
        await charbychar(char, delay);
      } catch (error) {
        console.error(error);
      }
    }
  }
  
  printValue();