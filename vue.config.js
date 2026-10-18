module.exports = {
  publicPath: process.env.NODE_ENV === 'production'
    ? '/NGSpaceCompanyFast/'
    : '/',
  devServer: {
    host: "testspacecompany.exileng.com",
    public: "testspacecompany.exileng.com",
  },
}
