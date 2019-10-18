import $ from 'jquery'

export default () => {
    var $text = $(".page-home")
    
    setInterval(function(){
        $text.width(Math.random() * 1024);
    }, 2500);
}