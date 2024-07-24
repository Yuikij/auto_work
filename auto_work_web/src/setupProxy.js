const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
    app.use(
        '/auto_work',
        createProxyMiddleware({
            target: 'http://localhost:9915',
            changeOrigin: true,
            pathRewrite: {
                '^/auto_work': '', // 移除 /auto_work 前缀
            },
        })
    );
};