# Spring

### 请先在根目录下创建config.json
```
{
    "db": {
        "dialect": "mysql",
        "user": "root",
        "password": "Your-Password",
        "host": "localhost",
        "library": "spring",
        "table":"hitokoto"
    }
}
```

### 调用方法

```
const spring = require('./lib/spring');
```
#### 创建API
```
spring.createApi(3000,'./web');
```
+ 第一个参数是端口
+ 第二个是静态资源目录，是可选参数

#### 调用方法

+ ./lib/spring模块内部有process，status ，UpdateEmotion三个方法，不建议在外部调用
+ 公共方法有similar，contrary ，emotion，plutchik，tend，可以在外部调用
+ 暴露一个createApi方法用于创建API，可以在外部调用
