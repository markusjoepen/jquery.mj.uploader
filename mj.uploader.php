<?
parse_str(base64_decode($_SERVER['QUERY_STRING']), $params);

function mj_filePreview($el)
{
	global $params;
	
	$type = strtolower(end(explode('.',$el)));
	
	switch($type){
		case in_array($type,array("jpg","jpeg","gif","png")):
			return '<img src="'.$el.'" class="'.$params['className'].' '.$type.'">';
			break;
		
		case in_array($type,array("mp4","m4v","mov","ogg","webm")):
			return '<video controls src="'.$el.'" class="'.$params['className'].' '.$type.'">Your browser does not support the &lt;VIDEO&gt; tag</video>';
			break;
		
		case "swf":
			return '
			<object classid="clsid:D27CDB6E-AE6D-11cf-96B8-444553540000" class="'.$params['className'].'">
			<param name="movie" value="'.$el.'" /><param name="wmode" value="transparent"><param name="loop" value="true">
			<!--[if !IE]>--><object type="application/x-shockwave-flash" data="'.$el.'" class="'.$params['className'].'"><!--<![endif]-->
			<param name="wmode" value="transparent"><param name="loop" value="true"><p class="'.$params['className'].'">'.$el.'</p>
			<!--[if !IE]>--></object><!--<![endif]--></object>';
			break;
		default:
			return '<div class="'.$params['className'].' '.$type.'">'.basename($el).'</div>';
	}
}

$display = '';
$status = 0;
$start = time();

if($_FILES)
{
	$dir = rtrim($params['dir'],'/');
	$fn_client = $_FILES[$params['id']]['name'];
	$fn_srv = $_FILES[$params['id']]['name'];
	$ext = '.'.end(explode('.',$_FILES[$params['id']]['name']));
	
	if($params['fileName']=='auto')
	{
		list($usec, $sec) = explode(' ', microtime());
		$fn_srv = sha1((float)$usec + (float)$sec + rand(0,99999999999)).'.'.strtolower(end(explode('.',$_FILES[$params['id']]['name'])));
	}
	
	$dest = $dir.'/'.$fn_srv;
	
	if(file_exists($dest))
	{
		if($params['fileConflict'] == 'keep')
		{
			$basename = basename($fn_srv, $ext);
			$suffix = 1;
			while(file_exists($dir.'/'.$basename.'_'.$suffix.$ext)) $suffix++;
				
			$fn_srv = $basename.'_'.$suffix.$ext;
			$dest = $dir.'/'.$fn_srv; 	
		}
	}
	
	if ($status == 0)
	{
		if(@move_uploaded_file($_FILES[$params['id']]['tmp_name'], $dest))
		{
			 $status = 1; //statusUploadSuccess
			 $display = mj_filePreview($dest);
		}else{
			$status = 10; // statusUploadError
		}
	}
	
	// :-)
	if((time()-$start) < 1) sleep(1);
	
}else if($_POST['file_rm'])
{
	$fn_client = basename($_POST['file_rm']);
	$fn_srv = basename($_POST['file_rm']);
	if(@unlink($_POST['file_rm']))
	{
		$status = 2; // statusDeleteSuccess
	}else{
		$status = 20; // statusDeleteError
	}
}else if(!empty($params['value']))
{
	$status = 3; // just showing an already uploaded file
	$display = mj_filePreview($params['dir'].'/'.$params['value']);
	$fn_client = $params['value'];
	$fn_srv = $params['value'];
	
}else if($params['directoryCheck']=='true')
{
	if(!is_dir($params['dir'])) exit('The specified upload directory <em>({"dir":<strong>"'.$params['dir'].'"</strong>})</em> does not exist!');
	if(!is_writable($params['dir'])) exit('The specified upload directory <em>({"dir":<strong>"'.$params['dir'].'"</strong>})</em> does exist, but it is not writable!');
}
?>
<?=$display?>
<form method="post" enctype="multipart/form-data">
    <input type="file" name="<?=$params['name']?>" onchange="window.parent.$.fn.mjIfrmXchange(window.name,this.value,this.value,0)">
</form>
<form method="post" enctype="application/x-www-form-urlencoded">
	<input type="hidden" name="file_rm" value="<?=$dest?>" />
</form>
<?
if(!empty($params['css'])){
?>
<link rel="stylesheet" type="text/css" href="<?=$params['css']?>" media="screen">
<? }  ?>
<style>
*{margin:0;padding:0;border:none;}
div,img,video,object{max-width:100%; max-height:100%;}
.<?=$params['classname']?>{/*cursor:pointer;*/}
<? if($status === 1 || $status === 3) {?> form{display:none;} <? } ?>
</style>
<? if($status > 0){ ?>
<script>
window.parent.$.fn.mjIfrmXchange(window.name,'<?=$fn_client?>','<?=$fn_srv?>','<?=$status?>');
</script>
<? } ?>