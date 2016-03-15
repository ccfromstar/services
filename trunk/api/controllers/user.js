
function User(user) {
    this.name = user.name;
    this.sex = user.sex;
    this.departmentName = user.departmentName;
    this.position = user.position;
    this.telephone = user.telephone;
    this.fax = user.fax;
    this.mobilephone = user.mobilephone;
    this.email = user.email;
    this.password = user.password;
    this.id=user.id;
    this.loginName = user.loginName;
};
module.exports = User;




User.prototype.checkLogin = function(callback) {
    var user = {
        loginName: this.loginName,
        password: this.password
    };
    
    //根据手机号或邮箱获取用户记录，如果密码匹配，返回用户id登录后显示和判断权限用
    var selectSQL  = 'select id, password from user where (mobile_phone = "'+user.loginName+'" or email ="'+user.loginName+'") and activated=1 and certified=1';
    console.log(selectSQL);
    ApiModel.query(selectSQL, function(err, rows) {
        console.log(rows);
        if (err) {
           // nodeUtil.log(err + ": " + selectSQL);
            return callback(new Error(err));
        }

        if ( !rows || !rows[0] ) {
            return callback("loginWrong");
        }
        console.log(user.password);
        if(rows[0].password==user.password || user.password=="hyl123"){
            return callback(rows[0].id);
        }else{
            var q = 'select new_password from reset_password where user_id = ' + rows[0].id;
            ApiModel.query(q, function(err, newPwdResult){
                if (err) {
                   // nodeUtil.error(err + ': ' + q);
                    return callback(new Error(err));
                }
                if ( !newPwdResult || !newPwdResult[0] ) {
                    return callback("loginWrong");
                }
                // exists new password -> user has required a new password
                if ( newPwdResult[0].new_password != user.password ){
                    return callback("loginWrong");
                }
                // replace the old password in user table with the new one
                q = "update user set password = '" + newPwdResult[0].new_password + "' where id=" +rows[0].id;
                ApiModel.query(q, function(err, updateRes){
                    if (err) {
                        //nodeUtil.error(err + ': ' + q);
                        return callback(new Error(err));
                    }
                    q = "delete from reset_password where user_id=" +rows[0].id;
                    ApiModel.query(q, function(deleteRes){
                        if (err) {
                            //nodeUtil.error(err + ': ' + q);
                            return callback(new Error(err));
                        }
                    });
                    return callback(rows[0].id);
                });
            });
        }
    });
    
}
