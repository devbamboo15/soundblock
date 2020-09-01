import { Component, OnInit, OnDestroy } from '@angular/core';
import { NbDialogRef } from '@nebular/theme';
import { SubSink } from 'subsink';
import { CollectionService } from 'src/app/services/project/collection';
import { ProjectService } from 'src/app/services/project/project';
import { SharedService } from 'src/app/services/shared/shared';
import { UploadService } from 'src/app/services/project/upload';
import { ZipService } from 'src/app/services/shared/zip';
import { File, Collection } from 'src/app/models/collection';

@Component({
  selector: 'app-upload',
  templateUrl: './upload.component.html',
  styleUrls: ['./upload.component.scss'],
})
export class UploadComponent implements OnInit, OnDestroy {

  private subs = new SubSink();
  project: any;
  curTab = '';
  file: any;
  comment: any;

  result = {
    music: [],
    video: [],
    merch: [],
    other: [],
  };

  constructor(
    protected dialogRef: NbDialogRef<any>,
    private projectService: ProjectService,
    private collectionService: CollectionService,
    private uploadService: UploadService,
    private zipService: ZipService,
    private sharedService: SharedService
  ) { }

  ngOnInit() {
    this.watchCurrentTab();
    this.watchProjectInfo();
  }

  watchCurrentTab() {
    this.subs.sink = this.collectionService.watchCurrentTab().subscribe(res => {
      this.curTab = res;
    });
  }
  watchProjectInfo() {
    this.subs.sink = this.projectService.watchProjectInfo().subscribe(res => {
      this.project = res;
    });
  }
  
  uploadFile() {
    // this.processFile();
    this.dialogRef.close({
      comment: this.comment,
      uploadFile: this.file,
    });
  }

  processFile() {
    console.log(this.file);
    if (this.file.type === 'application/zip' || this.file.type === 'application/x-zip-compressed') {
      this.uploadService.isZip = 1;
      this.extractZip(this.file);
    } else {
      this.uploadService.isZip = 0;
      this.classifyFiles([this.file]);
    }
  }

  extractZip(file) {
    this.subs.sink = this.zipService.getEntries(file).subscribe(res => {
      res = res.filter(item => {
        const filename =  this.getFilenameFromFullPath(item.filename);
        const name = this.sharedService.getFileName(filename);
        return !item.directory && name;
      });
      console.log('extract zip', res);
      this.classifyFiles(res);
    });
  }

  classifyFiles(files) {
    this.uploadService.files = { music: [], video: [], merch: [], other: [] };
    for (const file of files) {
      if (file.filename) {
        file.name = file.filename;
        file.size = file.uncompressedSize;
      }
      const filename =  this.getFilenameFromFullPath(file.name);
      const kind = this.sharedService.getFileKind(filename);
      const newFile = new File();
      newFile.org_file_sortby = file.name;
      newFile.file_name = filename;
      newFile.file_title = this.sharedService.getFileName(filename);
      newFile.file_size = file.size;
      switch (kind) {
        case 'mp3':
          newFile.file_category = 'music';
          this.uploadService.files.music.push(newFile);
          break;
        case 'mp4':
          newFile.file_category = 'video';
          this.uploadService.files.video.push(newFile);
          break;
        case 'ai':
        case 'psd':
          newFile.file_category = 'merch';
          this.uploadService.files.merch.push(newFile);
          break;
        default:
          newFile.file_category = 'other';
          this.uploadService.files.other.push(newFile);
          break;
      }
    }
    console.log('classifyFiles', this.uploadService.files);
  }

  fileSelected(event) {
    this.file = event;
    console.log('file', this.file);
    this.processFile();
  }

  getFilenameFromFullPath(str) {
    const segs = str.split('/');
    return segs[segs.length - 1];
  }
  close() {
    this.dialogRef.close();
  }

  ngOnDestroy() {
    this.subs.unsubscribe();
  }
}
