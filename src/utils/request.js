import Http from 'luch-request';


/** 错误统一处理方法 */
export const handleShowError = () => {
  showModal({
    content: '请重新登录',
    success: () => {
      uni.clearStorageSync();
      // uni.reLaunch({
      //   url: '/pages/index',
      // });
    },
  });
};

/** 请求实例 */
const instance = new Http({
  baseURL: domain || '',
  header: {
    'Accept': 'application/json',
    'Content-Type': 'application/json; charset=utf-8',
  },
  sslVerify: false,
});

instance.interceptors.request.use((config) => ({
  ...config,
  header: {
    ...config.header,
    'X-Token': '',
  },
}));

instance.interceptors.response.use(
  (response) => {
    const { data, config, statusCode } = response;
    // if (!data.success && config.custom?.showError !== false) {
    //   handleShowError(data);
    // }
    if (statusCode !== 200) {
      handleShowError(data);
    }
    return data;
  },
  (error) => {
    if (error.errMsg.includes('request:fail abort')) {
      return {
        success: false,
        message: '请求已取消',
        code: 'REQUEST_CANCELLED',
      };
    }
    const response = {
      success: false,
      message: '',
      code: '',
    };
    if (error.statusCode && (error.statusCode < 200 || error.statusCode >= 300)) {
      try {
        response.code = constantCase(statuses(error.statusCode).toString());
        response.message = constantCase(statuses(error.statusCode).toString());
      } catch {
        response.code = 'ERROR_OCCURRED';
        response.message = '发生了错误';
      }
    } else if (
      error.errMsg === 'request:fail abort statusCode:-1' ||
      error.errMsg.toUpperCase().includes('TIMEOUT') ||
      error.errMsg.toUpperCase().includes('CONNRESET') ||
      error.errMsg.toUpperCase().includes('CONNECTION_RESET')
    ) {
      // 超时
      response.message = '请求超时';
      response.code = 'REQUEST_TIMEOUT';
    } else if (error.data && Object.keys(error.data).length === 0) {
      // 发送了请求，没有收到响应
      response.message = '服务器无响应';
      response.code = 'NO_RESPONSE';
    } else {
      // 请求时发生错误
      response.message = '请求错误';
      response.code = 'REQUEST_ERROR';
    }
    // 处理错误
    if (error.config.custom?.showError !== false) {
      handleShowError(response);
    }
    return response;
  },
);

export default instance