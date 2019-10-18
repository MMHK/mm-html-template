import $ from 'jquery'

export default () => {
    var $text = $("#text_span"),
        counter = 0;
    
    setInterval(function(){
        counter++;
        $text.text(counter);
    }, 1000);
}