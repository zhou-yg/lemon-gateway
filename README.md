# lemon-gateway


## view service

> /lemon/services/[folder]/[entrance.html]


## config file

> app/public/services/[folder]/lemon.json

```
{
  // 转发代理设置
  "proxy": [
    {
      "host": ["http://localhost:8870"], // 如果是含有多个host，则是随机试验
      "match": "/pineapple/api/",
      "replace": "/lemon/api/"
    }
  ],
  "permission": [

  ],
  // 区分环境，仅在测试环境下生效
  "env": {
    "test": {
      "proxy": [
        {
          "host": "http://121.43.165.245:19003/",
          "match": "/pineapple/proxy/weike-crm/",
          "replace": "/"
        }
      ]
    }
  }
}
```
