/*
 * jQuery mj_uploader plugin
 * jQuery based file uploader
 * simple, iframe based uploader which displays uploaded images, videos and swf files after upload, and gives the option to delete uploaded files (on doubleclick)
 * 
 * v 1.1 // 2014-07-06
 * (c) 2012, 2013, 2014 markus joepen
 * learn more about this plugin at
 * http://www.emjay-media.com/code/jquery.mj_uploader/
 *
 */

if(jQuery)(function($) {
	
	var settings = {
			handler: 			'mj.uploader.php',
			dir: 				'/' ,
			directoryCheck:		true,
			fileTypes:			[],
			fileName:			'keep', // ["keep","auto"]
			fileConflict:		'keep', // ["keep","replace"]
			fileRemove: 		false, // 
			width:				'100%', 
			height:				'100%',
			progressAnimation:	1,
			className:			'uploadedFile',
			css:				'',
			statusBox:			false,
			statusUploadSuccess:'Your file <em>"{fileName}"</em> has been uploaded. {btnDelete}',
			statusUploadError:	'Something went wrong! Your file could not be uploaded.',
			statusDeleteConfirm:'Remove the file "{fileName}"?',
			statusDeleteSuccess:'Your file "{fileName}" was removed.',
			statusDeleteError:	'Your file could not be removed.',
			statusFileTypes:	'Sorry!\n"{fileName}" cannot be uploaded, because it is a "{fileType}" file. You may only upload <strong><em>{fileTypes}</em></strong> files!',
			statusBtnCancel:	'Cancel',
			statusBtnConfirm:	'OK',
			statusBtnDelete:	'Upload löschen'
		};
			
	var callbackFunc;	
	
	var mystatus = function(str,placeholder,value){
		return str.replace(placeholder,value)
	}
		
	$.extend($.fn, {
		
		mj_uploader : function(options, callback){
			callbackFunc = callback;
    		jQuery.extend(settings, options);
			
			for(var i in settings.fileTypes) settings.fileTypes[i] = settings.fileTypes[i].toLowerCase().replace(/\s/g, '');
			settings.className = settings.className.replace(/^[\.]/, '');
			
			var parameters = {
				name: $(this).attr('name'),
				id: $(this).attr('name'),
				value: $(this).val(),
				dir: settings.dir,
				fileTypes: settings.fileTypes,
				fileName: settings.fileName,
				fileConflict: settings.fileConflict,
				className: settings.className,
				directoryCheck: settings.directoryCheck,
				css: settings.css
			};
			
			return this.each(function(){
				var unique = '_' + Math.random().toString(36).substr(2, 9);
				
				var $iframe = $('<iframe />',{
					src: settings.handler + '?' + btoa($.param(parameters)),
					name: unique,
					id: unique,
					width:settings.width,
					height:settings.height,
					frameborder:0
				});
				
				var $progress = $(eval('progress'+parseInt(settings.progressAnimation)));
				
				var $hidden = $('<input />',{
					type:'hidden',
					name:$(this).attr('name'),
					id:$(this).attr('id'),
					value:$(this).val()
				});
				
				$progress.css({"position":"relative","left":"0","top":"0","display":"none"});			
				
				$(this).replaceWith($iframe);
				$iframe.before($progress);
				$iframe.after($hidden);
			})
		},
		
		mjIfrmXchange : function(ifrm,fn_client, fn_srv, status){
						
			var statusTexts = {
				statusUploadSuccess: 	settings.statusUploadSuccess,
				statusUploadError:		settings.statusUploadError,
				statusDeleteConfirm:	settings.statusDeleteConfirm,
				statusDeleteSuccess:	settings.statusDeleteSuccess,
				statusDeleteError:		settings.statusDeleteError,
				statusFileTypes:		settings.statusFileTypes
			}
	
			for(var i in statusTexts){
				var str = statusTexts[i];
				str = str.replace('{fileName}', fn_client.split('\\').pop());
				str = str.replace('{fileNameServer}', fn_srv);
				str = str.replace('{fileType}', fn_srv.split('.').pop());
				str = str.replace('{fileTypes}', '"' + settings.fileTypes.join('", "')+'"');
				str = str.replace('{url}', settings.dir+'/'+fn_srv);
				if(!settings.fileRemove) str = str.replace('{btnDelete}', '');
				statusTexts[i] = str;
			}
	
			var statusBoxText = '', statusClass='';
			
			$(settings.statusBox).html('').attr('class','');
			
			switch(parseInt(status)){
				case 0: statusBoxText = statusTexts.statusFileTypes; statusClass = 'statusFileTypes'; break;
				case 1: statusBoxText = statusTexts.statusUploadSuccess; statusClass = 'statusUploadSuccess'; break;
				case 10: statusBoxText = statusTexts.statusUploadError; statusClass = 'statusUploadError'; break;
				case 2: statusBoxText = statusTexts.statusDeleteSuccess; statusClass = 'statusDeleteSuccess'; break;
				case 20: statusBoxText = statusTexts.statusDeleteError; statusClass = 'statusDeleteError'; break;
			}
				
			if (status == 0) {
				
				// pre-upload actions
				
				if(settings.fileTypes.length > 0){
					var file_ext=fn_client.toLowerCase().split('.').pop();
					if($.inArray(file_ext,settings.fileTypes) == -1){
						
						if(settings.statusBox)
							$(settings.statusBox).html(statusBoxText).addClass(statusClass);
						else
							alert(statusBoxText);
							
						return;
					}
				}
				
				$('#'+ifrm).css("visibility","hidden");
				$('#'+ifrm).prev('div').show();
				window.frames[ifrm].document.forms[0].submit();
			}else {
			
				// post-upload actions
				//if(typeof callbackFunc == 'function') callbackFunc.call(this, {file:file,status:status});
				
				if(status === 2) fn_srv=''; // <-- file has been unlinked
				
				if(settings.statusBox) $(settings.statusBox).html(statusBoxText).addClass(statusClass);
				
				$('#'+ifrm).prev('div').hide();
				$('#'+ifrm).css("visibility","visible");
				$('#'+ifrm).next('input[type="hidden"]').val(fn_srv);
				
				if(settings.fileRemove === true){
					var preview = window.frames[ifrm].document.getElementsByClassName(settings.className);			
					$(preview).on('dblclick',function(){
						
						if(settings.statusBox){
							
							var $btnCancel = $('<button />',{
								text:settings.statusBtnCancel
							});
							
							$btnCancel.on('click',function(){
								$(settings.statusBox).html('').attr('class','');
							});
							
							var $btnConfirm = $('<button />',{
								text: settings.statusBtnConfirm
							});
							
							$btnConfirm.on('click',function(){
								window.frames[ifrm].document.forms[1].submit();
							});
							
							$(settings.statusBox).html(statusTexts.statusDeleteConfirm).addClass('statusDeleteConfirm');
							$(settings.statusBox).append($btnCancel, $btnConfirm);
						}else{
							var confirmPrompt = confirm(statusTexts.statusDeleteConfirm);
							if(confirmPrompt) window.frames[ifrm].document.forms[1].submit();
						}
					});
					
					
					var $btnDelete = $('<button />',{
								text:settings.statusBtnDelete
						});
						
					$btnDelete.on('click',function(){
							$(preview).trigger('dblclick');
						});
					
					if($(settings.statusBox).html().indexOf('{btnDelete}') > -1){
						$(settings.statusBox).html($(settings.statusBox).html().replace('{btnDelete}',''));
						$(settings.statusBox).append($btnDelete);
					}

				}	
			}
			
		}
	});
	
		// line of blocks
	var progress1 = '<style> #squaresWaveG{position:relative;width:99px;height:12px}.squaresWaveG{position:absolute;top:0;background-color:#000;width:12px;height:12px;-moz-animation-name:bounce_squaresWaveG;-moz-animation-duration:1s;-moz-animation-iteration-count:infinite;-moz-animation-direction:linear;-webkit-animation-name:bounce_squaresWaveG;-webkit-animation-duration:1s;-webkit-animation-iteration-count:infinite;-webkit-animation-direction:linear;-ms-animation-name:bounce_squaresWaveG;-ms-animation-duration:1s;-ms-animation-iteration-count:infinite;-ms-animation-direction:linear;-o-animation-name:bounce_squaresWaveG;-o-animation-duration:1s;-o-animation-iteration-count:infinite;-o-animation-direction:linear;animation-name:bounce_squaresWaveG;animation-duration:1s;animation-iteration-count:infinite;animation-direction:linear}#squaresWaveG_1{left:0;-moz-animation-delay:.4s;-webkit-animation-delay:.4s;-ms-animation-delay:.4s;-o-animation-delay:.4s;animation-delay:.4s}#squaresWaveG_2{left:13px;-moz-animation-delay:.5s;-webkit-animation-delay:.5s;-ms-animation-delay:.5s;-o-animation-delay:.5s;animation-delay:.5s}#squaresWaveG_3{left:26px;-moz-animation-delay:.6s;-webkit-animation-delay:.6s;-ms-animation-delay:.6s;-o-animation-delay:.6s;animation-delay:.6s}#squaresWaveG_4{left:39px;-moz-animation-delay:.7s;-webkit-animation-delay:.7s;-ms-animation-delay:.7s;-o-animation-delay:.7s;animation-delay:.7s}#squaresWaveG_5{left:52px;-moz-animation-delay:.8s;-webkit-animation-delay:.8s;-ms-animation-delay:.8s;-o-animation-delay:.8s;animation-delay:.8s}#squaresWaveG_6{left:65px;-moz-animation-delay:.9s;-webkit-animation-delay:.9s;-ms-animation-delay:.9s;-o-animation-delay:.9s;animation-delay:.9s}#squaresWaveG_7{left:78px;-moz-animation-delay:1s;-webkit-animation-delay:1s;-ms-animation-delay:1s;-o-animation-delay:1s;animation-delay:1s}#squaresWaveG_8{left:91px;-moz-animation-delay:1.1s;-webkit-animation-delay:1.1s;-ms-animation-delay:1.1s;-o-animation-delay:1.1s;animation-delay:1.1s}@-moz-keyframes bounce_squaresWaveG{0%{background-color:#000}100%{background-color:#FFF}}@-webkit-keyframes bounce_squaresWaveG{0%{background-color:#000}100%{background-color:#FFF}}@-ms-keyframes bounce_squaresWaveG{0%{background-color:#000}100%{background-color:#FFF}}@-o-keyframes bounce_squaresWaveG{0%{background-color:#000}100%{background-color:#FFF}}@keyframes bounce_squaresWaveG{0%{background-color:#000}100%{background-color:#FFF}}</style> <div id="squaresWaveG"> <div id="squaresWaveG_1" class="squaresWaveG"> </div> <div id="squaresWaveG_2" class="squaresWaveG"> </div> <div id="squaresWaveG_3" class="squaresWaveG"> </div> <div id="squaresWaveG_4" class="squaresWaveG"> </div> <div id="squaresWaveG_5" class="squaresWaveG"> </div> <div id="squaresWaveG_6" class="squaresWaveG"> </div> <div id="squaresWaveG_7" class="squaresWaveG"> </div> <div id="squaresWaveG_8" class="squaresWaveG"> </div> </div>';

	
		// classic spinner
	var progress2='<style> #floatingBarsG{position:relative;width:21px;height:24px}.blockG{position:absolute;background-color:#FFF;width:3px;height:7px;-moz-border-radius:3px 3px 0 0;-moz-transform:scale(0.4);-moz-animation-name:fadeG;-moz-animation-duration:1.04s;-moz-animation-iteration-count:infinite;-moz-animation-direction:linear;-webkit-border-radius:3px 3px 0 0;-webkit-transform:scale(0.4);-webkit-animation-name:fadeG;-webkit-animation-duration:1.04s;-webkit-animation-iteration-count:infinite;-webkit-animation-direction:linear;-ms-border-radius:3px 3px 0 0;-ms-transform:scale(0.4);-ms-animation-name:fadeG;-ms-animation-duration:1.04s;-ms-animation-iteration-count:infinite;-ms-animation-direction:linear;-o-border-radius:3px 3px 0 0;-o-transform:scale(0.4);-o-animation-name:fadeG;-o-animation-duration:1.04s;-o-animation-iteration-count:infinite;-o-animation-direction:linear;border-radius:3px 3px 0 0;transform:scale(0.4);animation-name:fadeG;animation-duration:1.04s;animation-iteration-count:infinite;animation-direction:linear}#rotateG_01{left:0;top:9px;-moz-animation-delay:.39s;-moz-transform:rotate(-90deg);-webkit-animation-delay:.39s;-webkit-transform:rotate(-90deg);-ms-animation-delay:.39s;-ms-transform:rotate(-90deg);-o-animation-delay:.39s;-o-transform:rotate(-90deg);animation-delay:.39s;transform:rotate(-90deg)}#rotateG_02{left:3px;top:3px;-moz-animation-delay:.52s;-moz-transform:rotate(-45deg);-webkit-animation-delay:.52s;-webkit-transform:rotate(-45deg);-ms-animation-delay:.52s;-ms-transform:rotate(-45deg);-o-animation-delay:.52s;-o-transform:rotate(-45deg);animation-delay:.52s;transform:rotate(-45deg)}#rotateG_03{left:9px;top:1px;-moz-animation-delay:.65s;-moz-transform:rotate(0deg);-webkit-animation-delay:.65s;-webkit-transform:rotate(0deg);-ms-animation-delay:.65s;-ms-transform:rotate(0deg);-o-animation-delay:.65s;-o-transform:rotate(0deg);animation-delay:.65s;transform:rotate(0deg)}#rotateG_04{right:3px;top:3px;-moz-animation-delay:.78s;-moz-transform:rotate(45deg);-webkit-animation-delay:.78s;-webkit-transform:rotate(45deg);-ms-animation-delay:.78s;-ms-transform:rotate(45deg);-o-animation-delay:.78s;-o-transform:rotate(45deg);animation-delay:.78s;transform:rotate(45deg)}#rotateG_05{right:0;top:9px;-moz-animation-delay:.9099999999999999s;-moz-transform:rotate(90deg);-webkit-animation-delay:.9099999999999999s;-webkit-transform:rotate(90deg);-ms-animation-delay:.9099999999999999s;-ms-transform:rotate(90deg);-o-animation-delay:.9099999999999999s;-o-transform:rotate(90deg);animation-delay:.9099999999999999s;transform:rotate(90deg)}#rotateG_06{right:3px;bottom:2px;-moz-animation-delay:1.04s;-moz-transform:rotate(135deg);-webkit-animation-delay:1.04s;-webkit-transform:rotate(135deg);-ms-animation-delay:1.04s;-ms-transform:rotate(135deg);-o-animation-delay:1.04s;-o-transform:rotate(135deg);animation-delay:1.04s;transform:rotate(135deg)}#rotateG_07{bottom:0;left:9px;-moz-animation-delay:1.1700000000000002s;-moz-transform:rotate(180deg);-webkit-animation-delay:1.1700000000000002s;-webkit-transform:rotate(180deg);-ms-animation-delay:1.1700000000000002s;-ms-transform:rotate(180deg);-o-animation-delay:1.1700000000000002s;-o-transform:rotate(180deg);animation-delay:1.1700000000000002s;transform:rotate(180deg)}#rotateG_08{left:3px;bottom:2px;-moz-animation-delay:1.3s;-moz-transform:rotate(-135deg);-webkit-animation-delay:1.3s;-webkit-transform:rotate(-135deg);-ms-animation-delay:1.3s;-ms-transform:rotate(-135deg);-o-animation-delay:1.3s;-o-transform:rotate(-135deg);animation-delay:1.3s;transform:rotate(-135deg)}@-moz-keyframes fadeG{0%{background-color:#000}100%{background-color:#FFF}}@-webkit-keyframes fadeG{0%{background-color:#000}100%{background-color:#FFF}}@-ms-keyframes fadeG{0%{background-color:#000}100%{background-color:#FFF}}@-o-keyframes fadeG{0%{background-color:#000}100%{background-color:#FFF}}@keyframes fadeG{0%{background-color:#000}100%{background-color:#FFF}}</style> <div id="floatingBarsG"> <div class="blockG" id="rotateG_01"> </div> <div class="blockG" id="rotateG_02"> </div> <div class="blockG" id="rotateG_03"> </div> <div class="blockG" id="rotateG_04"> </div> <div class="blockG" id="rotateG_05"> </div> <div class="blockG" id="rotateG_06"> </div> <div class="blockG" id="rotateG_07"> </div> <div class="blockG" id="rotateG_08"> </div> </div>';

	
	

	
})(jQuery);