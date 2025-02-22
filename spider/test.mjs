let today = new Date();
let year = today.getFullYear();
let day = today.getDate();
let month = today.getMonth() + 1;

// +1是因为getMonth()函数返回的月份是从0开始的，所以需要加1
// '0'这里是确保如果某位数小于10时，他前面会自动补0， 如：假设日期是10号，new String(-).padStart(2, '0')后变为"010"，完成空位的补全

month = month.toString().padStart(2, '0');
day = day.toString().padStart(2, '0');
let formatTime = year + month + day;
console.log(formatTime);