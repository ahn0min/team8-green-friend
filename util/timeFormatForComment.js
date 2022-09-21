const timeObj = {
  seconds: 1000,
  minute: 1000 * 60,
  hour: 1000 * 3600,
  day: 1000 * 3600 * 24,
  month: 1000 * 30 * 3600 * 24,
  year: 1000 * 30 * 3600 * 365,
};

module.exports = timeFormatForComment = time => {
  const current = new Date();
  const createdAt = new Date(time);
  const distance = current - createdAt;

  if (distance < timeObj.minute) {
    return `${Math.floor(distance / timeObj.seconds) || 1}초 전`;
  }

  if (timeObj.minute <= distance && distance < timeObj.hour) {
    return `${Math.floor(distance / timeObj.minute)}분 전`;
  }

  if (timeObj.hour <= distance && distance < timeObj.day) {
    return `${Math.floor(distance / timeObj.hour)}시간 전`;
  }

  if (timeObj.day <= distance && distance < timeObj.month) {
    return `${Math.floor(distance / timeObj.day)}일 전`;
  }

  if (timeObj.month <= distance && distance < timeObj.year) {
    return `${Math.floor(distance / timeObj.month)}월 전`;
  }

  if (timeObj.year <= distance) {
    return `${Math.floor(distance / timeObj.year)}년 전`;
  }
};
