// /**
//  * request 网络请求工具
//  * 更详细的 api 文档: https://github.com/umijs/umi-request
//  */
// import { notification } from 'antd';
// import { history } from 'umi';
// import { extend } from 'umi-request';
// import config from '../../config/proxy';
//
// const WSMap = {
//   'http:': 'ws:',
//   'https:': 'wss:',
// };
//
// function getParas() {
//   return window.location.origin;
// }
//
// export function getWSProtocol() {
//   const { protocol } = window.location;
//   let wsProtocol = 'ws:';
//   // if (protocol === 'https:') {
//   //   wsProtocol = 'ws:';
//   // }
//   return wsProtocol;
// }
//
// //带端口号的
// export function getHost() {
//   const host = window.location.hostname;
//   const localParas = config.dev['/api'].target;
//   return (host === 'localhost' ? localParas : getParas()).split('://')[1].split('/')[0];
// }
//
// //不带端口号的
// export function getVideoHost() {
//   const host = window.location.hostname;
//   const localParas = config.dev['/api'].target;
//   return (host === 'localhost' ? localParas : getParas()).split('://')[1].split(':')[0];
// }
//
// // export function Token() {
// //   return '?token=' + window.localStorage.getItem('token');
// // }
//
// const env = process.env.NODE_ENV;
// const proxyIp = config.dev['/api'].target;
//
// export const LOCAL_SOCKET = proxyIp.replace('https', 'wss').replace('http', 'ws');
// export const ONLINE_SOCKET = `${WSMap[location.protocol]}//${window.location.host}`;
// export const SOCKET_URL = env === 'development' ? LOCAL_SOCKET : ONLINE_SOCKET;
// export const img_url_time_token = (url) =>
//   (process.env.NODE_ENV === 'development' ? proxyIp : getParas()) +
//   url +
//   `?T=${new Date().getTime()}&token=${localStorage.getItem('backDetectionToken')}`;
//
// export const baseUrl = process.env.NODE_ENV === 'development' ? '/api' : '';
// export const updateFirmwareUrl = baseUrl + '/version/firmware/update?token=';
// export const updateLicenseUrl = baseUrl + '/version/license/update?token=';
// export const updateNirLicenseUrl = baseUrl + '/version/nir/license/update?token=';
//
// const codeMessage = {
//   200: '服务器成功返回请求的数据。',
//   201: '新建或修改数据成功。',
//   202: '一个请求已经进入后台排队（异步任务）。',
//   204: '删除数据成功。',
//   400: '发出的请求有错误，服务器没有进行新建或修改数据的操作。',
//   401: '用户没有权限（令牌、用户名、密码错误）。',
//   403: '用户得到授权，但是访问是被禁止的。',
//   404: '发出的请求针对的是不存在的记录，服务器没有进行操作。',
//   406: '请求的格式不可得。',
//   410: '请求的资源被永久删除，且不会再得到的。',
//   422: '当创建一个对象时，发生一个验证错误。',
//   500: '服务器发生错误，请检查服务器。',
//   502: '网关错误。',
//   503: '服务不可用，服务器暂时过载或维护。',
//   504: '网关超时。',
// };
// /**
//  * 异常处理程序
//  */
//
// const errorHandler = (error) => {
//   const { response } = error;
//
//   if (response && response.status) {
//     const errorText = codeMessage[response.status] || response.statusText;
//     const { status, url } = response;
//     notification.error({
//       message: `请求错误`,
//       description: errorText,
//     });
//     if (response.status === 401) {
//       history.replace({
//         pathname: '/user/login',
//       });
//     }
//   } else if (!response) {
//     notification.error({
//       description: '您的网络发生异常，无法连接服务器',
//       message: '网络异常',
//     });
//   }
//   return response;
// };
// /**
//  * 配置request请求时的默认参数
//  */
//
// const request = extend({
//   errorHandler,
//   // 默认错误处理
//   credentials: 'include', // 默认请求是否带上cookie
//   prefix: baseUrl,
//   // suffix: `?token=${localStorage.getItem('backDetectionToken')}`,
//   params: {
//     token: localStorage.getItem('backDetectionToken'), // 所有请求默认带上 token 参数
//     // token: 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJleHAiOjE2MDQ3NDg0NTkwNzgsInBheWxvYWQiOiJ7XCJwYXNzd29yZFwiOlwiJDJhJDEwJGJEY3cub0dVcm9UcHNqWjBmdGV5Vk9mRnJjZ0wvVEQ5cHB1VEJvbW83MDNGeEcyNjdsMTZlXCIsXCJyb2xlXCI6MSxcInVzZXJpZFwiOjIsXCJ1c2VybmFtZVwiOlwiYWRtaW5cIn0ifQ.eUZynEz9Nibpu1iZLv-shSEYW_zSqhFmPPV-U4AXYeI'// 所有请求默认带上 token 参数
//   },
// });
//
// // request拦截器, 改变url 或 options.
// request.interceptors.request.use((url, options) => {
//   options.params = {
//     token: localStorage.getItem('backDetectionToken'),
//   };
//   return {
//     url,
//     options,
//   };
// });
//
// export default request;
