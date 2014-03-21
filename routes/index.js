/* GET home page. */
var 
  rest = require('../fetch.js'),
  jsdom = require('jsdom'),
  html = '<html><body><h1>Hello World!</h1><p class="hello">Heya Big World!</body></html>';

exports.index = function(req, res){
  var env = jsdom.env;
  var keywordEntries = [];

  // javascript(职位) + 北京 + 最近三天 + 全职,忽略少于20人的用人单位
  keywordEntries.push('http://sou.zhaopin.com/Jobs/searchresult.ashx?pd=3&jl=北京&kw=javascript&sm=0&p=1&sf=0&kt=3&cs=2%3B3%3B4%3B5%3B6&et=2');
  // phonegap(全文) + 北京 + 最近三天 + 全职,忽略少于20人的用人单位
  keywordEntries.push('http://sou.zhaopin.com/Jobs/SearchResult.ashx?pd=3&jl=北京&kw=phonegap&sm=0&p=1&sf=0&cs=2%3B3%3B4%3B5%3B6&et=2');
  // jquery mobile(全文) + 北京 + 最近三天 + 全职,忽略少于20人的用人单位
  keywordEntries.push('http://sou.zhaopin.com/Jobs/SearchResult.ashx?pd=3&jl=北京&kw=jquery%20mobile&sm=0&p=1&sf=0&cs=2%3B3%3B4%3B5%3B6&et=2');
  // node.js(全文) + 北京 + 最近三天 + 全职,忽略少于20人的用人单位
  keywordEntries.push('http://sou.zhaopin.com/Jobs/SearchResult.ashx?pd=3&jl=北京&kw=node.js&sm=0&p=1&sf=0&cs=2%3B3%3B4%3B5%3B6&et=2');
  // backbone(全文) + 北京 + 最近三天 + 全职,忽略少于20人的用人单位
  keywordEntries.push('http://sou.zhaopin.com/Jobs/SearchResult.ashx?pd=3&jl=北京&kw=backbone&sm=0&p=1&sf=0&cs=2%3B3%3B4%3B5%3B6&et=2');
  
  domEnv(function($) {
    var dataArr = [];
    
    var promises = [];
    
    for (var i = 0, l = keywordEntries.length; i < l; i++) {
      var thisPromise = fetchListData(keywordEntries[i]);
      promises = promises.concat(thisPromise);
    }
    
    var obj = {};
    
    $.whenall(promises).then(testFunc, function (err) {
        console.log("ERROR!");
    });
    
    function testFunc() {
      // Filter
      var newdataArr = dataArr.filter(filterResult);
      // Next filter
      var newResult = [];
      var detailPromises = [];
      var doneCount = 0;
      var promiseLen = newdataArr.length; 
      newdataArr.forEach(function(element, index, array) {
        var urlArr = element.jobUrl.split('/'),
        options = {
            host: urlArr[2],
            path: '/' + urlArr[3], 
            port: 80,
            method: 'GET'
        };
        var thisPromise = fetchJobData(options).then(function(data){
          // filter again 
          if (data.companyType == '国企') {
          } else if (data.hirecount == '若干') {
          } else if (data.salary != '面议' && data.salary.split(/\-|元\/月/)[1] <= 15000) {
          } else if (data.jobType == '网页设计/制作/美工') {
          } else {
            newResult = newResult.concat(element); 
          }
        }).always(function(){
          doneCount++; 
          console.log('Progress:', doneCount/promiseLen * 100 + '%');
          if (doneCount == promiseLen) {
            console.log('[DONE!!!]newResult',newResult); 
            res.render('index', { title: 'Express', data: newResult, num: newResult.length });
          }
        });         
        detailPromises = detailPromises.concat(thisPromise); 
      });
      $.whenall(detailPromises);
    }
    
    function fetchListData(option) {
      var d = $.Deferred();
      rest.getHTML(option, function(statusCode, result) {
        if (statusCode == 200) {
          env(result, function(errors, window) {
            var $ = require('jquery')(window);
            var items = $(".search-result-tab");
            items.each(function(){
              var obj = {};
              var item = $(this);
              
              var jobTitleLink = item.find('.Jobname').find('a');
              obj.jobTitle = jobTitleLink.text().trim();
              obj.jobUrl = jobTitleLink.attr('href');
              var companyLink = item.find('.Companyname').find('a');
              obj.company = companyLink.text().trim();
              obj.companyUrl = companyLink.attr('href');
              obj.address = item.find('.Companyaddress').text().trim();
              obj.releaseTime = item.find('.releasetime').text().trim();
              
              var subContainer = item.find('.search-result-infotab').find('.tabCol1');
              obj.companyType = subContainer.find('span').eq(1).text().split('：').pop().trim();
              obj.companySize = subContainer.find('span').eq(2).text().split('：').pop().trim();
              obj.jobEducation = subContainer.find('span').eq(3).text().split('：').pop().trim();
              dataArr.push(obj);
              
            });
            d.resolve(result);
          });
        } else {
          d.reject(result);
        }
      });
      return d.promise();
    }

    function fetchJobData(option) {
      var d = $.Deferred();
      rest.getHTML(option, function(statusCode, result) {
        if (statusCode == 200) {
          env(result, function(errors, window) {
            try {
              console.log("url:", option.host+option.path, ' ERROR:', errors);
              var $ = require('jquery')(window);
              var container = $("div.terminalpage-left");
              var topCon = container.find('div.terminalpage-left-top');
              var topConTop = topCon.find('.terminalpage-table').eq(0);
              var topConMain = topCon.find('.terminalpage-table').eq(1);
              var mainCon = container.find('div.terminalpage-main').eq(0); 
              var topConTopTDs =  topConTop.find('td');
              var topConMainTDs =  topConMain.find('td');
                var obj = {};

                obj.companyType = topConTopTDs.eq(5).text().trim();
                obj.companyHangye = topConTopTDs.eq(7).text().trim();
                
                obj.workDuration = topConMainTDs.eq(1).text().trim(); 
                obj.education = topConMainTDs.eq(5).text().trim(); 
                obj.manageExp = topConMainTDs.eq(7).text().trim(); 
                obj.salary = topConMainTDs.eq(9).text().trim(); 
                obj.hirecount = topConMainTDs.eq(11).text().trim(); 
                obj.jobType = topConMainTDs.eq(15).text().trim(); 
                
              d.resolve(obj);
            } catch (err) {
              d.reject(err);
            }
          });
        } else {
          d.reject(result);
        }
      });
      return d.promise();
    }
    
    function filterResult(element) {
      var jobUrl = element['jobUrl'];
      var jobTitle = element['jobTitle'];
      var companyName = element['company'];
      var address = element['address'];
      var jobTitleFilterExp = /美工|网页|制作|兼职|微信|设计师|ios|android|c#|c\+\+|\.net|php|java(?!script)|开发人员|外派|毕业生|中级|初级|高薪|经验|附近|程序员/i;
      var companyFilterExp = /高德软件|慧聪网|观其互动|太极计算机|华清中科|锤子科技|能力天空|汽车之家|智联招聘|经典时空|竞技世界|通金易汇|经纬盈科|萃英信息技术|国信灵通|网秦天下|普华和诚|顺丰电子商务|去哪儿|合众传播|卓信创佳|中软国际|浪潮方智|微博易|创业未来传媒|宝宝树|软通动力|宜信公司|凤凰网|猎聘网|万银财富|管理顾问|敦煌网|教育|聚美优品|百度/i;
      var addressFilterExp = /石景山区|大兴区/;
      if ( jobUrl in obj) {
        return false;
      } else if (jobTitle.search(jobTitleFilterExp) != -1) {
        return false;
      } else if(companyName.search(companyFilterExp) != -1) {
        return false;
      } else if (address.search(addressFilterExp) != -1) {
        return false;
      }else {
        obj[jobUrl] = true;
        return true;
      }
    }
  });
  
  function domEnv(callback) {
    env(html, function(errors, window) {
      var $ = require('jquery')(window);
      $.whenall = function(arr) { return $.when.apply($, arr); };
      callback($);
    });
  }
};
