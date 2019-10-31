# 所有命令都要在`udemy-bafeisol/database`資料夾中執行

# 重建全新的databse `store`
```
$ cp rawdata_*.csv / ; mysql -u root --password=1234 < database_store.sql ; rm /rawdata_*.csv ;
```

# 重建全新的table `contacts` (要先確認database `store` 已存在)
```
$ cp rawdata_*.csv / ; mysql -u root --password=1234 < table_contacts.sql ; rm /rawdata_*.csv ;
```

# 重建全新的table `orders` (要先確認database `store` 已存在)
```
$ cp rawdata_*.csv / ; mysql -u root --password=1234 < table_orders.sql ; rm /rawdata_*.csv ;
```

# 重建全新的table `products` (要先確認database `store` 已存在)
```
$ cp rawdata_*.csv / ; mysql -u root --password=1234 < table_products.sql ; rm /rawdata_*.csv ;
```

# 重建全新的table `sessions` (要先確認database `store` 已存在)
```
$ cp rawdata_*.csv / ; mysql -u root --password=1234 < table_sessions.sql ; rm /rawdata_*.csv ;
```

# 重建全新的table `users` (要先確認database `store` 已存在)
```
$ cp rawdata_*.csv / ; mysql -u root --password=1234 < table_users.sql ; rm /rawdata_*.csv ;
```

# 重建全新的table `users` (要先確認database `store` 已存在)，且hash是使用`bcrypt`模組
```
$ cp rawdata_*.csv / ; mysql -u root --password=1234 < table_users_bcrypt.sql ; rm /rawdata_*.csv ;
```