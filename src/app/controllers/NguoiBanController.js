const User = require('../models/Users')
const Product = require('../models/Product')
const GioHang = require('../models/GioHang')
const Bill = require('../models/Bill')
const Notify = require('../models/Notify')
const mongoose = require('mongoose')
mongoose.Promise = require('bluebird');
const jwt = require('jsonwebtoken')
const { resolve } = require('bluebird')
const http = require('http')

class NguoiBanController {
    //[POST] /kenhnguoiban
    sent(req, res, next) {
        console.log(req.body)
        let bills = JSON.parse(req.body.bill)
        Bill.findOne({user_slug: bills.user_slug, product_slug: bills.product_slug, send: 0})
        .then(bill => {
            if (bill) {
                Product.findOne({slug: bill.product_slug})
                .then(product => {
                    bill['send'] = 1;
                    bill.save()
                    .then(() => {
                        //lưu thông báo
                        var no = new Notify({user_slug: bill.user_slug, data: `Đơn hàng mã ${bill._id} sản phẩm ${product.name} của bạn đã được xác nhận`})
                        no.save()
                        .then(() => {
                            // gọi đến /zalo/sendmessage để xử lý gửi tin nhắn ezns hoặc esms
                            const requestBody = JSON.stringify({
                                shop_slug: bill.shop_slug,
                                cus_slug: bill.user_slug
                            })

                            var options = {
                                    hostname: 'localhost',
                                    port: 3000,
                                    path: '/zalo/sendmessage',
                                    method: 'POST',
                                    headers: {
                                        'Content-Type': 'application/json',
                                        'Content-Length': Buffer.byteLength(requestBody)
                                    }
                                }
                                const request = http.request(options, response => {
                                    response.setEncoding('utf8');
                                    response.on('data', (body) => {
                                        //CodeResult = 103 vì tài khoản trên không đủ tiền.
                                        // console.log('success')
                                    });
                                    response.on('end', () => {
                                        console.log('xong');
                                    });
                                })
            
                                request.on('error', (e) => {
                                    console.log(`problem with request: ${e.message}`);
                                });
                                request.write(requestBody);
                                request.end('')
                        })
                        .catch(err => {console.log(`problem with request: ${err}`)})
                        console.log('success', bill)
                        res.status(204).send('cập nhật thành công')
                    })
                    .catch(err => {
                        res.status(204).send('cập nhật không thành công')
                    })
                })
                .catch(err => {
                    res.status(204).send(err.message)
                })
            }
            else {
                res.status(204).send('cập nhật không thành công')
            }
        })
    }


    //[POST] /kenhnguoiban/create
    create(req, res, next) {
        var product = new Product(req.body)
        product.count = 0;
        const token = req.cookies.token
        const id = jwt.verify(token, 'daisy')
        User.findOne({_id: id})
        .then(user => {
            product.user_slug = user.slug
        })
        .catch(err => {})
        product.price_discount = product.price
        product.save()
        .then(() => {res.redirect('/kenhnguoiban')})
        .catch(err => {res.send(err.message)})
    }


    //[GET] /kenhnguoiban
    show(req, res, next) {
        if (req.cookies.token){
            function resolveAfter2Seconds(x) {
                return new Promise((resolve) => {
                  setTimeout(() => {
                    resolve(x);
                  }, 1500);
                });
            }
            const token = req.cookies.token
            const id = jwt.verify(token, 'daisy')
            User.findOne({_id: id, role: 'seller'})
            .then(user => {
                if (user) {
                    let b = []
                    let user_buy = new Array
                    let product_buy = new Array
                    // dùng for loop
                    // (Product.find({user_slug: user.slug}))
                    // .then(products => {
                    //     var p = []
                    //     for (var i = 0; i < products.length; i++) {
                    //     // products.forEach(async (element, i) => {
                    //         Promise.all([GioHang.findOne({product_slug: products[i].slug})])
                    //         .then((data) => {
                    //             // setTimeout(() => {p[i] = data.length},100);
                    //             p.push(data.length)
                    //             // setTimeout(() => {console.log(i)},1000);
                    //             // i++;
                    //         })
                    //         .catch(err => {})
                    //     // });
                    //     }
                    //     // setTimeout(() => {console.log(-1)},1000); 
                    //     // res.render('kenhnguoiban.html', {products: products, user: user, check: 1, countCart: 0})
                    //     // setTimeout(() => {res.send(p); return},1000); 
                    //     res.send(p)                
                        
                    // dùng tương tự bên giỏ hàng

                    Product.find({user_slug: user.slug})
                    .then(products =>{
                        var promise = new Promise( function(resolve, reject) {
                            let pr = [];
                            Bill.find({shop_slug: user.slug})
                            .then(bills => {
                                b = bills
                                bills.forEach((element, i) => {
                                    User.findOne({slug: element.user_slug})
                                    .then((user) => {
                                        user_buy[i] = user
                                    })
                                    .catch((err) => {})
    
                                    Product.findOne({slug: element.product_slug})
                                    .then((product) => {
                                        product_buy[i] = product
                                    })
                                    .catch((err) => {})
                                })
                            })
                            .catch((err) => {})

                            
                            products.forEach((element, i) => {
                                GioHang.find({product_slug: element.slug})
                                .then((data) => {
                                    if (data != null){
                                        // console.log(product)
                                        console.log(i)
                                        pr[i] = 0
                                        
                                        for (let j = 0; j < data.length; j++) {
                                            pr[i] += data[j].count
                                        }
                                        // console.log(products)
                                    }
                                    // i++;
                                })
                                .catch(err => {})
                            });

                            if (pr) {
                                resolve(pr)
                            } else {
                                reject()
                            }
                        })
                        promise.then(async (pr) => {
                            pr = await resolveAfter2Seconds(pr)
                            console.log(pr)
                            console.log(product_buy)
                            console.log(user_buy)
                            console.log(-1)
                            // res.render('giohang.html', {products: pr, check: 1, user: user, countCart: counts})
                            res.render('kenhnguoiban.html', {products: products, user: user, check: 1, countCart: 0, boGio: pr, users_buy: user_buy, products_buy: product_buy, bills: b})
                            //res.send(pr)
                            

                        })
                        .catch(err => {res.send(err.message)})
                        
                    })
                    .catch(err => {res.send(err.message)})
                    // dùng foreach
                        // products.forEach(async (element, index) => {
                        //     GioHang.find({product_slug: element.slug})
                        //     .exec()
                        //     .then(function (data) {
                        //         // Đếm số lượng giỏ hàng chứa sản phẩm, vd sau mà ko xóa giỏ thì có thể thêm trường đã mua chưa để thêm vào cho nó ko trùng
                        //         console.log(index)
                        //         if (data)
                        //             products[index].countC = data.length
                        //     })
                        //     .catch(err => {})
                        // })
                        // return products
                    // })
                    // .then(products => {
                        // console.log(-1)
                        // // res.render('kenhnguoiban.html', {products: products, user: user, check: 1, countCart: 0})
                        // res.send(products);
                    // })
                    // res.render('kenhnguoiban.html', {user: user})
                } else {
                    res.render('login.html', {check: 0})
                }
            })
            .catch(err => {
                res.send('loi')
            })
        } else {
            res.render('login.html', {check: 0})
        }
    }
}

module.exports = new NguoiBanController()
