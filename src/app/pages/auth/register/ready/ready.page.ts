import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { NgForm } from '@angular/forms';
import { SubSink } from 'subsink';

import { AuthService } from 'src/app/services/account/auth';
import { SharedService } from 'src/app/services/shared/shared';

@Component({
  selector: 'app-ready',
  templateUrl: './ready.page.html',
  styleUrls: ['./ready.page.scss'],
})
export class ReadyPage implements OnInit, OnDestroy {
  private subs = new SubSink();
  password = '';
  email = '';
  user = {
    name: '',
    password: '',
    email: ''
  };
  passwordStrength = '';
  passwordConfirm = '';
  matched = false;
  agreed = false;

  constructor(
    private router: Router,
    private authService: AuthService,
    private sharedService: SharedService
  ) { }

  ngOnInit() {
  }

  signIn(form: NgForm) {
    if (!form.valid) { return; }
    this.subs.sink = this.authService.signIn(this.email, this.password).subscribe(res => {
        this.router.navigate(['/auth/signup/1']);
    }, (err) => {
      console.log(err);
    });
  }

  navigate(url: string) {
    this.router.navigate([`/auth/${url}`]);
  }

  signUp(form: NgForm) {
    if (!form.valid || !this.agreed) { return; }
    this.subs.sink = this.authService.signUp(this.user.name, this.user.email, this.user.password, this.passwordConfirm).subscribe((res: any) => {
      console.log({res});
      this.router.navigate(['/auth/signup/1']);
    }, (err: Error) => {
      console.error(err.message);
    });
  }

  mustMatch(password, confirmPassword): boolean {
    if (password === confirmPassword && this.passwordStrength === 'Strong') {
      return (this.matched = true);
    } else if (password === confirmPassword && this.passwordStrength === 'Medium') {
      return (this.matched = true);
    } else {
      return (this.matched = false);
    }
  }

  onChangePassword() {
    this.passwordStrength = this.sharedService.checkPasswordStrength(
      this.user.password
    );
  }
  ngOnDestroy() {
    this.subs.unsubscribe();
  }
}
