/* GET home page. */
var rest = require('../public/javascripts/fetch.js'),
    $ = require('jquery');
    jsdom = require('jsdom'),
    $.whenall = function(arr) { return $.when.apply($, arr); };
exports.index = function(req, res){
  
  var optionsArr = [];
  // javascript(职位) + 北京 + 最近三天 + 全职,忽略少于20人的用人单位
  var options = {
      host: 'sou.zhaopin.com',
      port: 80,
      path: '/Jobs/searchresult.ashx?pd=3&jl=北京&kw=javascript&sm=0&p=1&sf=0&kt=3&cs=2%3B3%3B4%3B5%3B6&et=2',
      method: 'GET'
  };
  
  optionsArr.push(options);
  
  // phonegap(全文) + 北京 + 最近三天 + 全职,忽略少于20人的用人单位
  var options = {
      host: 'sou.zhaopin.com',
      port: 80,
      path: '/Jobs/SearchResult.ashx?pd=3&jl=北京&kw=phonegap&sm=0&p=1&sf=0&cs=2%3B3%3B4%3B5%3B6&et=2',
      method: 'GET'
  };
  optionsArr.push(options);
  
  // jquery mobile(全文) + 北京 + 最近三天 + 全职,忽略少于20人的用人单位
  var options = {
      host: 'sou.zhaopin.com',
      port: 80,
      path: '/Jobs/SearchResult.ashx?pd=3&jl=北京&kw=jquery%20mobile&sm=0&p=1&sf=0&cs=2%3B3%3B4%3B5%3B6&et=2',
      method: 'GET'
  };
  optionsArr.push(options);
  
  // node.js(全文) + 北京 + 最近三天 + 全职,忽略少于20人的用人单位
  var options = {
      host: 'sou.zhaopin.com',
      port: 80,
      path: '/Jobs/SearchResult.ashx?pd=3&jl=北京&kw=node.js&sm=0&p=1&sf=0&cs=2%3B3%3B4%3B5%3B6&et=2',
      method: 'GET'
  };
  optionsArr.push(options);
  
  // backbone(全文) + 北京 + 最近三天 + 全职,忽略少于20人的用人单位
  var options = {
      host: 'sou.zhaopin.com',
      port: 80,
      path: '/Jobs/SearchResult.ashx?pd=3&jl=北京&kw=backbone&sm=0&p=1&sf=0&cs=2%3B3%3B4%3B5%3B6&et=2',
      method: 'GET'
  };
  optionsArr.push(options);
  
  
  var dataArr = [];
  
  function fetchData(option) {
    var d = $.Deferred();
    rest.getHTML(option, function(statusCode, result) {
      //console.log('onResult:(' + statusCode);
      //console.log(result);
      if (statusCode == 200) {
        //console.log('current search:', $('.currentsearch').text())
        var document = jsdom.jsdom(result);
        var window = document.createWindow();
        var script = document.createElement("script");
        script.src = 'http://code.jquery.com/jquery-1.4.2.js';
        script.onload = function() {
          //dataArr = dataArr.concat(parseItem(window.jQuery(".search-result-tab")));
          var items = window.jQuery(".search-result-tab");
          //console.log('length', items.length);
          items.each(function(){
            var obj = {};
            var item = window.jQuery(this);
            //console.log(item.html());
            
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
        };
        document.head.appendChild(script);
      } else {
        d.reject(result);
      }
    });
    return d.promise();
  }
  

  
  var promises = [];
  
  for (var i = 0, l = optionsArr.length; i < l; i++) {
    var thisPromise = fetchData(optionsArr[i]);
    promises = promises.concat(thisPromise);
  }
  
  var obj = {};
  function filterResult(element) {
    var jobUrl = element['jobUrl'];
    var jobTitle = element['jobTitle'];
    var companyName = element['company'];
    var address = element['address'];
    var jobTitleFilterExp = /美工|网页|制作|兼职|ios|android|c#|c\+\+|\.net|java(?!script)|开发人员|外派|毕业生|中级|初级|高薪|经验|附近|程序员/i;
    var companyFilterExp = /高德软件|慧聪网|敦煌网|教育|聚美优品|百度/i;
    var addressFilterExp = /石景山区|大兴区/;
    if ( jobUrl in obj) {
      //console.log("Double Item:", dataArr[i]);
      //dataArr.splice(i, 1);
      return false;
    } else if (jobTitle.search(jobTitleFilterExp) != -1) {
      console.log("KEYWORD Item:", element);
      //dataArr.splice(i, 1);
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
  
  $.whenall(promises).then(function (tt) {
    // Filter
    console.log('Before filter, dataArr length', dataArr.length);
    
    var newdataArr = dataArr.filter(filterResult);
    console.log('after filter, dataArr length', newdataArr.length);
      res.render('index', { title: 'Express', data: newdataArr, num: newdataArr.length });
  }, function (err) {
      //dtd.reject(err);
      console.log("ERROR!");
  });
};
