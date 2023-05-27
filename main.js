//读文件
let xhr = new XMLHttpRequest();
// xhr.open('GET', '/1.junior.txt', false);
// xhr.send();

let junior = document.querySelector('.junior');
let senior = document.querySelector('.senior');
let cet4 = document.querySelector('.cet4');
let cet6 = document.querySelector('.cet6');
let postgraduate = document.querySelector('.postgraduate');
let toefl = document.querySelector('.toefl');
let sat = document.querySelector('.sat');

let lines;
let values;
let p1, p2;
let t = ['初中', '高中', '四级', '六级', '考研', '托福', 'SAT'];
let type = (x) => {
    if (!x)//第一次打开网站
        x = '初中';
    return () => {
        localStorage.setItem("类型", x);
        n();
        xhr.open('GET', `/${x}.txt`, false);
        xhr.send();
        //按照回车和tab分开
        lines = xhr.responseText.split('\n');
        values = lines.map(line => line.split('\t'));
        //把单词和中文翻译渲染出来 
        p1 = document.querySelector('#map0');
        p1.innerHTML = values[num][0];
        p2 = document.querySelector('#map1');
        p2.innerHTML = values[num][1];
        //渲染左下角当前单词
        nownum.innerHTML = `&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp当前单词为${localStorage.getItem("类型")}的第${num + 1}个`
    }
}
     
junior.addEventListener('click',type(t[0]))
senior.addEventListener('click', type(t[1]))
cet4.addEventListener('click', type(t[2]))
cet6.addEventListener('click', type(t[3]))
postgraduate.addEventListener('click', type(t[4]))
toefl.addEventListener('click', type(t[5]))
sat.addEventListener('click', type(t[6]))

//本地存，当前第几个
let nownum = document.querySelector('.nownum');
let key = 'number1';
let num = 0;

let n = function () {
    if (localStorage.getItem("类型") === "初中") {
        key = 'number1'
        num = localStorage.getItem(key) ? Number(localStorage.getItem(key)) : 0; 
    }
    if (localStorage.getItem("类型") === "高中") {
        key = 'number2'
        num = localStorage.getItem(key) ? Number(localStorage.getItem(key)) : 0; 
    } 
    if (localStorage.getItem("类型") === "四级"){
        key = 'number3'
        num = localStorage.getItem(key) ? Number(localStorage.getItem(key)) : 0; 
    }
    if (localStorage.getItem("类型") === "六级"){
        key = 'number4'
        num = localStorage.getItem(key) ? Number(localStorage.getItem(key)) : 0; 
    }
    if (localStorage.getItem("类型") === "考研"){
        key = 'number5'
        num = localStorage.getItem(key) ? Number(localStorage.getItem(key)) : 0; 
    }
    if (localStorage.getItem("类型") === "托福"){
        key = 'number6'
        num = localStorage.getItem(key) ? Number(localStorage.getItem(key)) : 0; 
    }
    if (localStorage.getItem("类型") === "SAT"){
        key = 'number7'
        num = localStorage.getItem(key) ? Number(localStorage.getItem(key)) : 0; 
    }
}

//当前第几个显示在左下
nownum.innerHTML = `&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp当前单词为${localStorage.getItem("类型")}的第${num+1}个`

//左右按钮，上一个下一个
let left = document.querySelector('.left');
left.addEventListener('click', () => {
    if(num!=0)//第一个没有上一个
        num--;
    localStorage.setItem(key, num);//存当前是第几个
    p1.innerHTML = values[num][0];
    p2.innerHTML = values[num][1];
    nownum.innerHTML = `&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp当前单词为${localStorage.getItem("类型")}的第${num+1}个`
})

let right = document.querySelector('.right');
right.addEventListener('click', () => {   
    num++;
    localStorage.setItem(key, num)
    p1.innerHTML = values[num][0];
    p2.innerHTML = values[num][1];
    nownum.innerHTML = `&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp当前单词为${localStorage.getItem("类型")}的第${num+1}个`
})
 
//getItem判断not以前是否存过，存过的话json先转成数组，没存过的话先初始化成数组
let not = localStorage.getItem('not') ? JSON.parse(localStorage.getItem('not')) : [];
let makenot = document.querySelector('.makenot');//监听<不会>按钮的点击事件
makenot.addEventListener('click', () => {
    const length = not.length;
    let flag = false;//为了去重，存过的不在存
    for (let i = 0; i < length; i++){
        if (not[i].toString() === values[num].toString())
        {
            flag = true;
            break;
        }    
    }
    if (flag) {
        return;
    }

    not.push(values[num]);
    //setItem存在localStorage里，用stringify把数组转成json
    localStorage.setItem('not', JSON.stringify(not));
    
    //每次not变化，都重新清空渲染
    clear();
    render();
})

//把不会的渲染在右面
const notlist = document.querySelector('.notlist');

//清空
const clear = function () {
    while (notlist.firstChild) {
        notlist.removeChild(notlist.firstChild);//删除
    }
}
//渲染
const render = function () {
    for (let i = 0; i < not.length; i++){
    const divEl = document.createElement("div");//创建元素
    divEl.innerHTML = not[i];//元素内容为单词
    notlist.appendChild(divEl);//指定这个元素的父亲为notlist
    divEl.style.marginBottom = '9px';//每个词中间的空隙

    const btn = document.createElement("button");
    btn.innerHTML = 'X';
    divEl.appendChild(btn);
    btn.classList.add('x');//给这个button添加类
    }
}

//第一次渲染notlist
render();

notlist.addEventListener('click', (event) => {
    //查目标元素是否为button元素
    if (event.target.tagName === 'BUTTON') {
        //取目标元素在其父元素中的索引
        const targetIndex = Array.from(event.target.parentNode.parentNode.children).indexOf(event.target.parentNode);
        not.splice(targetIndex, 1);
        localStorage.setItem('not', JSON.stringify(not));
        //重新存，新not替换旧的not
        clear();
        render();
    }
})

//浏览器第一次打开 
type(localStorage.getItem('类型'))(); 