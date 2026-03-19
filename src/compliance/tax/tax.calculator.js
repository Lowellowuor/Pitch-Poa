class TaxCalculator {
  static calculateVAT(sales, purchases) {
    const rate = 0.16; // 16% VAT
    const outputVAT = sales * (rate / (1 + rate));
    const inputVAT = purchases * (rate / (1 + rate));
    const payable = outputVAT - inputVAT;
    
    return {
      outputVAT: Math.round(outputVAT * 100) / 100,
      inputVAT: Math.round(inputVAT * 100) / 100,
      payable: Math.round(payable * 100) / 100,
      rate: rate * 100
    };
  }
  
  static calculatePAYE(grossPay) {
    // Simplified PAYE calculation
    let tax = 0;
    if (grossPay > 24000) {
      tax = (grossPay - 24000) * 0.3;
    }
    
    return {
      grossPay,
      taxablePay: grossPay,
      paye: Math.round(tax * 100) / 100,
      nssf: Math.min(grossPay * 0.06, 1080),
      nhif: this.calculateNHIF(grossPay)
    };
  }
  
  static calculateNHIF(grossPay) {
    if (grossPay <= 5999) return 150;
    if (grossPay <= 7999) return 300;
    if (grossPay <= 11999) return 400;
    if (grossPay <= 14999) return 500;
    if (grossPay <= 19999) return 600;
    if (grossPay <= 24999) return 750;
    if (grossPay <= 29999) return 850;
    if (grossPay <= 34999) return 900;
    if (grossPay <= 39999) return 950;
    if (grossPay <= 44999) return 1000;
    if (grossPay <= 49999) return 1100;
    if (grossPay <= 59999) return 1200;
    if (grossPay <= 69999) return 1300;
    if (grossPay <= 79999) return 1400;
    if (grossPay <= 89999) return 1500;
    if (grossPay <= 99999) return 1600;
    return 1700;
  }
}

module.exports = TaxCalculator;
