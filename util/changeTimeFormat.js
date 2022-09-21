module.exports = changeTimeFormat = timestamp => {
  const time = new Date(timestamp);
  const year = time.getFullYear();
  const month = time.getMonth() + 1;
  const date = time.getDate();
  return `${year}년 ${month}월 ${date}일`;
};
